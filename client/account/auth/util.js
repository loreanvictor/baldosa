export const niceKeyName = async () => {
  const { UAParser } = await import('ua-parser-js')

  // Initialize the UAParser object
  const parser = new UAParser()
  const result = parser.getResult()

  // Extract relevant information
  const browser = result.browser.name      // e.g., "Chrome", "Safari", "Firefox"
  const os = result.os.name                // e.g., "Windows", "macOS", "iOS"
  const deviceModel = result.device.model  // e.g., "iPhone", "Galaxy S9", undefined for desktops
  const deviceType = result.device.type    // e.g., "mobile", "tablet", undefined for desktops

  // Construct the passkey name
  let passkeyName
  if (deviceModel) {
      // Use device model for specific devices like phones or tablets
      passkeyName = `${browser} on ${deviceModel}`
  } else if (deviceType) {
      // Use device type if model isn’t available but type is (less common)
      passkeyName = `${browser} on ${deviceType}`
  } else {
      // Default to OS for desktops or when no device info is present
      passkeyName = `${browser} on ${os}`
  }

  return passkeyName
}
