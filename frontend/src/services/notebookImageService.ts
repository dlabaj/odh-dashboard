import axios from 'axios';
import { Notebook } from '../types';

export const fetchNotebooks = (): Promise<Notebook[]> => {
  const url = '/api/notebook';
  return axios
    .get(url)
    .then((response) => {
      return response.data.notebooks;
    })
    .catch((e) => {
      throw new Error(e.response.data.message);
    });
};

// export const updateClusterSettings = (
//   settings: ClusterSettings,
// ): Promise<{ success: boolean; error: string }> => {
//   const url = '/api/cluster-settings/update';
//   const updateParams = new URLSearchParams();

//   updateParams.set('pvcSize', `${settings.pvcSize}`);

//   const options = { params: updateParams };
//   return axios
//     .get(url, options)
//     .then((response) => {
//       return response.data;
//     })
//     .catch((e) => {
//       throw new Error(e.response.data.message);
//     });
// };