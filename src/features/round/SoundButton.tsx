import { useEffect, useState } from 'react'
import { playSound, preloadSounds } from '@/shared/lib/sound'
import { shuffleBag } from '@/shared/lib/shuffleBag'
import { Icon } from '@/shared/ui/Icon'
import { memeSounds } from './memeSounds'
import styles from './SoundButton.module.css'

// One deck for the questions and the discussion, so the order goes on across the two screens.
const nextSound = shuffleBag(memeSounds)

/**
 * Plays a random sound (a meme reaction) on this phone only: the whole table hears it anyway. A
 * new tap cuts the sound playing. Anyone can use it during the questions and the discussion.
 */
export function SoundButton() {
  const [taps, setTaps] = useState(0)

  useEffect(() => {
    preloadSounds(memeSounds)
  }, [])

  if (memeSounds.length === 0) return null

  return (
    <button
      type="button"
      className={styles.button}
      aria-label="Tocar um som"
      onClick={() => {
        playSound(nextSound(), 'memes')
        setTaps((n) => n + 1)
      }}
    >
      {/* A new key per tap replays the wiggle. */}
      <span key={taps} className={styles.icon} data-played={taps > 0 || undefined}>
        <Icon name="volume" size={24} />
      </span>
    </button>
  )
}
