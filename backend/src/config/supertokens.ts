import supertokens from 'supertokens-node';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import Session from 'supertokens-node/recipe/session';
import { logger } from '../utils/logger';
import { upsertUser } from '../database/queries';

export function initSuperTokens() {
  const connectionUri = process.env.SUPERTOKENS_URI || 'http://localhost:3567';

  const googleProvider = () => ({
    config: {
      thirdPartyId: 'google',
      name: 'Google',
      clients: [{
        clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
      }],
    },
  });

  supertokens.init({
    supertokens: {
      connectionURI: connectionUri,
      apiKey: process.env.SUPERTOKENS_API_KEY || undefined,
    },
    appInfo: {
      appName: 'Pitchr',
      apiDomain: process.env.FRONTEND_URL || 'http://localhost:3000',
      websiteDomain: process.env.FRONTEND_URL || 'http://localhost:3000',
      apiBasePath: '/api/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      ThirdPartyEmailPassword.init({
        providers: [googleProvider()],
        override: {
          apis: (originalImplementation) => ({
            ...originalImplementation,
            emailPasswordSignUpPOST: async (input) => {
              const response = await originalImplementation.emailPasswordSignUpPOST!(input);
              if (response.status === 'OK') {
                if (!response.user.emails?.length) {
                  logger.error('No email returned from SuperTokens signup');
                  throw new Error('No email returned from SuperTokens');
                }
                const firstName = input.formFields?.find((f: { id: string }) => f.id === 'first_name')?.value;
                const lastName = input.formFields?.find((f: { id: string }) => f.id === 'last_name')?.value;
                await upsertUser(response.user.id, response.user.emails[0], firstName, lastName);
              }
              return response;
            },
            emailPasswordSignInPOST: async (input) => {
              const response = await originalImplementation.emailPasswordSignInPOST!(input);
              if (response.status === 'OK') {
                if (!response.user.emails?.length) {
                  logger.error('No email returned from SuperTokens signin');
                  throw new Error('No email returned from SuperTokens');
                }
                await upsertUser(response.user.id, response.user.emails[0]);
              }
              return response;
            },
            thirdPartySignInUpPOST: async (input) => {
              const response = await originalImplementation.thirdPartySignInUpPOST!(input);
              if (response.status === 'OK') {
                const user = response.user;
                if (!user.emails?.length) {
                  logger.error('No email returned from SuperTokens Google sign-in');
                  throw new Error('No email returned from SuperTokens');
                }
                await upsertUser(user.id, user.emails[0]);
              }
              return response;
            },
          }),
        },
      }),
      Session.init(),
    ],
  });

  logger.info('SuperTokens initialized');
}
