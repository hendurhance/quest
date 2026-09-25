import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/vue'
import CatalogSelect from '@/manager/components/CatalogSelect.vue'

const ready = (ids: string[], available = ids) => ({
  status: 'ready' as const,
  items: ids.map((id) => ({ id, name: id })),
  available,
})

describe('CatalogSelect', () => {
  it('flags a saved model the provider no longer lists', () => {
    const { queryByText } = render(CatalogSelect, {
      props: { modelValue: 'gemini-2.5-flash', placeholder: 'Choose…', state: ready(['gemini-3.8-flash']) },
    })
    expect(queryByText(/No longer offered/)).not.toBeNull()
  })

  it('does not flag a model the provider lists but the picker hides, such as a dated snapshot', () => {
    const { queryByText, getByRole } = render(CatalogSelect, {
      props: {
        modelValue: 'gpt-4.1-2025-04-14',
        placeholder: 'Choose…',
        state: ready(['gpt-4.1'], ['gpt-4.1', 'gpt-4.1-2025-04-14']),
      },
    })
    expect(queryByText(/No longer offered/)).toBeNull()
    expect(getByRole('combobox')).toHaveProperty('value', 'gpt-4.1-2025-04-14')
  })
})
