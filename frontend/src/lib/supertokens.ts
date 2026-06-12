import SuperTokens from 'supertokens-web-js';
import ThirdParty from 'supertokens-web-js/recipe/thirdparty';

let initialized = false;

export function initSuperTokens() {
  if (initialized || typeof window === 'undefined') return;
  SuperTokens.init({
    appInfo: {
      appName: 'Pitchr',
      apiDomain: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
      apiBasePath: '/api/auth',
    },
    recipeList: [
      ThirdParty.init(),
    ],
  });
  initialized = true;
}
