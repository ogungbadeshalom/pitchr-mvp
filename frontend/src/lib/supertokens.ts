import SuperTokens from 'supertokens-web-js';
import ThirdParty from 'supertokens-web-js/recipe/thirdparty';

let initialized = false;

export function initSuperTokens() {
  if (initialized || typeof window === 'undefined') return;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001';
  SuperTokens.init({
    appInfo: {
      appName: 'Pitchr',
      apiDomain: origin,
      apiBasePath: '/api/auth',
    },
    recipeList: [
      ThirdParty.init(),
    ],
  });
  initialized = true;
}
