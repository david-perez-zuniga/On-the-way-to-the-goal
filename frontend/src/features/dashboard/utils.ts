interface GoalVisual {
  icon: string
  iconBg: string
  iconColor: string
}

const visualMap: Array<{ keywords: string[]; visual: GoalVisual }> = [
  {
    keywords: ['casa', 'hogar', 'departamento', 'propiedad'],
    visual: { icon: 'home', iconBg: 'rgba(0, 103, 127, 0.1)', iconColor: 'var(--color-primary)' },
  },
  {
    keywords: ['auto', 'carro', 'coche', 'vehículo', 'tesla'],
    visual: { icon: 'directions_car', iconBg: 'rgba(0, 109, 53, 0.1)', iconColor: 'var(--color-secondary)' },
  },
  {
    keywords: ['viaje', 'europa', 'vacaciones', 'vuelo', 'travel'],
    visual: { icon: 'flight', iconBg: 'rgba(73, 75, 214, 0.1)', iconColor: 'var(--color-tertiary)' },
  },
  {
    keywords: ['laptop', 'macbook', 'computadora', 'pc', 'notebook'],
    visual: { icon: 'laptop_mac', iconBg: 'rgba(0, 103, 127, 0.1)', iconColor: 'var(--color-primary)' },
  },
  {
    keywords: ['emergencia', 'fondo', 'ahorro', 'seguro'],
    visual: { icon: 'shield', iconBg: 'rgba(186, 26, 26, 0.1)', iconColor: 'var(--color-error)' },
  },
]

const defaultVisual: GoalVisual = {
  icon: 'savings',
  iconBg: 'rgba(0, 103, 127, 0.1)',
  iconColor: 'var(--color-primary)',
}

export function getGoalVisual(title: string): GoalVisual {
  const lower = title.toLowerCase()
  const match = visualMap.find(({ keywords }) => keywords.some((kw) => lower.includes(kw)))
  return match?.visual ?? defaultVisual
}
