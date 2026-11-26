import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('shows the initials without a photo', () => {
    const { container } = render(<Avatar name="Duda Fernandes" />)
    expect(container).toHaveTextContent('DF')
    expect(container.querySelector('img')).toBeNull()
  })

  it('shows the photo, and the initials again when it fails to load', () => {
    const { container, rerender } = render(<Avatar name="Ana" src="/a.jpg" />)
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('src', '/a.jpg')
    expect(container).not.toHaveTextContent('A')

    fireEvent.error(img)
    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('A')

    // A new photo is tried again.
    rerender(<Avatar name="Ana" src="/b.jpg" />)
    expect(container.querySelector('img')).toHaveAttribute('src', '/b.jpg')
  })
})
