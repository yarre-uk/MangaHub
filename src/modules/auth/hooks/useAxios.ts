import { useContext, useEffect } from 'react';

import useRefreshToken from './useRefreshToken';

import { ResponseStatusCode } from '@/constants';
import { AuthContext } from '@/modules/auth';
import { axiosAuth } from '@/utils';

const useAxios = () => {
  const refresh = useRefreshToken();
  const { accessToken } = useContext(AuthContext);

  useEffect(() => {
    const requestIntercept = axiosAuth.interceptors.request.use(
      (config) => {
        if (!config.headers['Authorization']) {
          config.headers['Authorization'] = `${accessToken}`;
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseIntercept = axiosAuth.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;

        if (
          error?.response?.status === ResponseStatusCode.NOT_AUTHORIZED &&
          prevRequest?.url !== '/auth/signin' &&
          !prevRequest?.sent
        ) {
          prevRequest.sent = true;
          const newAccessToken = await refresh();

          prevRequest.headers['Authorization'] = `${newAccessToken}`;

          return axiosAuth(prevRequest);
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axiosAuth.interceptors.request.eject(requestIntercept);
      axiosAuth.interceptors.response.eject(responseIntercept);
    };
  }, [accessToken, refresh]);

  return axiosAuth;
};

export default useAxios;
