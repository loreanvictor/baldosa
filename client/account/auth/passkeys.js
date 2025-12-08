let _passkey_supported = true

if ('PublicKeyCredential' in window) {
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then((supported) => {
    _passkey_supported = supported
  })
} else {
  _passkey_supported = false
}

export const passkeySupported = () => _passkey_supported
