// Environment variable validation — secrets only; see config/settings.json for constants
export function validateEnvironmentVariables(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const secretVars = ['AIRTABLE_API_KEY', 'FIREBASE_PRIVATE_KEY'];

  secretVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      errors.push(`Missing environment variable: ${varName}`);
    }
  });

  if (
    import.meta.env.FIREBASE_PRIVATE_KEY &&
    !import.meta.env.FIREBASE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')
  ) {
    errors.push('FIREBASE_PRIVATE_KEY appears to be malformed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateEnvironmentOnStartup(): void {
  const validation = validateEnvironmentVariables();

  if (!validation.isValid) {
    console.error('❌ Environment validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Environment validation failed. Check your environment variables.');
  }

  console.log('✅ Environment variables validated successfully');
}
