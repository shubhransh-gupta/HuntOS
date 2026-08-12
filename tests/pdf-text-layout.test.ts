import { describe, expect, it } from 'vitest'
import { groupItemsIntoLines, type PositionedTextItem } from '@/services/parser/pdf-text-layout'

function item(str: string, x: number, y: number, width = str.length * 5): PositionedTextItem {
  return { str, x, y, width, height: 10 }
}

describe('groupItemsIntoLines', () => {
  it('rebuilds visual lines from positioned fragments', () => {
    const lines = groupItemsIntoLines([
      item('Priya Sharma', 50, 700),
      item('Marketing Manager', 50, 680),
      item('Skills', 50, 640),
      item('Brand Strategy, SEO', 50, 620),
    ])

    expect(lines).toEqual(['Priya Sharma', 'Marketing Manager', 'Skills', 'Brand Strategy, SEO'])
  })

  it('keeps fragments on the same baseline together, ordered left to right', () => {
    const lines = groupItemsIntoLines([
      item('Manager', 120, 700, 40),
      item('Marketing', 50, 700, 45),
    ])

    expect(lines).toEqual(['Marketing Manager'])
  })

  it('tolerates slight baseline drift within a line', () => {
    const lines = groupItemsIntoLines([
      item('Senior', 50, 700, 30),
      item('Engineer', 85, 701.5, 40),
    ])

    expect(lines).toEqual(['Senior Engineer'])
  })

  it('does not invent a space when fragments are flush', () => {
    const lines = groupItemsIntoLines([item('Hunt', 50, 700, 20), item('OS', 70, 700, 10)])

    expect(lines).toEqual(['HuntOS'])
  })

  it('orders lines from the top of the page downwards', () => {
    const lines = groupItemsIntoLines([
      item('bottom', 50, 100),
      item('top', 50, 700),
      item('middle', 50, 400),
    ])

    expect(lines).toEqual(['top', 'middle', 'bottom'])
  })

  it('ignores whitespace-only fragments', () => {
    expect(groupItemsIntoLines([item(' ', 50, 700), item('Name', 60, 700)])).toEqual(['Name'])
    expect(groupItemsIntoLines([])).toEqual([])
  })
})
