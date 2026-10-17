// Pitch (F0) tracking of a recording, entirely in the browser, for the Echo tone chart.

const RATE = 12000 // analyse at a low sample rate: plenty for voice pitch, ~16× less work
const MIN_HZ = 70
const MAX_HZ = 500

/** Pitch in Hz every 10 ms (null = silence / unvoiced). */
export async function pitchTrack(blob: Blob): Promise<(number | null)[]> {
  const ctx = new AudioContext()
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer())
  void ctx.close()
  const x = downsample(buf.getChannelData(0), buf.sampleRate, RATE)

  const win = Math.round(RATE * 0.04)
  const hop = Math.round(RATE * 0.01)
  const minLag = Math.floor(RATE / MAX_HZ)
  const maxLag = Math.ceil(RATE / MIN_HZ)
  const loudness = Math.sqrt(x.reduce((n, v) => n + v * v, 0) / x.length)

  const track: (number | null)[] = []
  for (let start = 0; start + win + maxLag < x.length; start += hop) {
    let energy = 0
    for (let i = start; i < start + win; i++) energy += x[i] * x[i]
    if (Math.sqrt(energy / win) < Math.max(0.005, loudness * 0.6)) {
      track.push(null)
      continue
    }
    // Normalised autocorrelation: the lag that best matches the frame with itself is one pitch period.
    let bestR = 0
    let bestLag = 0
    for (let lag = minLag; lag <= maxLag; lag++) {
      let xy = 0
      let yy = 0
      for (let i = start; i < start + win; i++) {
        xy += x[i] * x[i + lag]
        yy += x[i + lag] * x[i + lag]
      }
      const r = xy / Math.sqrt(energy * yy || 1)
      if (r > bestR) [bestR, bestLag] = [r, lag]
    }
    track.push(bestR > 0.6 ? RATE / bestLag : null)
  }
  return medianFilter(track)
}

function downsample(data: Float32Array, from: number, to: number): Float32Array {
  const step = from / to
  const out = new Float32Array(Math.floor(data.length / step))
  for (let i = 0; i < out.length; i++) {
    let sum = 0
    const a = Math.floor(i * step)
    const b = Math.floor((i + 1) * step)
    for (let j = a; j < b; j++) sum += data[j]
    out[i] = sum / Math.max(1, b - a)
  }
  return out
}

/** Smooths single-frame octave glitches. */
function medianFilter(t: (number | null)[]): (number | null)[] {
  return t.map((v, i) => {
    if (v === null) return null
    const w = t.slice(Math.max(0, i - 2), i + 3).filter((n): n is number => n !== null).sort((a, b) => a - b)
    return w[Math.floor(w.length / 2)]
  })
}
