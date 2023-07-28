export interface PropertiesEvent {
  propertiesPanelSet?: boolean
}

export function markEventAsPropertiesSet(event: MouseEvent): void {
  // Somewhat type-unsafe way of letting upper events know they should try to set properties
  const anyEvent = event as PropertiesEvent
  anyEvent.propertiesPanelSet = true
}

export function isPropertiesPanelAlreadySetForEvent(event: MouseEvent): boolean {
  return !!(event as PropertiesEvent).propertiesPanelSet
}
