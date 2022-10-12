import compareVersions from 'compare-versions';
import { NotebookSize, Volume, VolumeMount } from '../../../../types';
import { BuildKind, ImageStreamKind, ImageStreamSpecTagType } from '../../../../k8sTypes';
import { FAILED_PHASES, PENDING_PHASES } from './const';
import {
  BuildStatus,
  ImageStreamSelectOptionObjectType,
  ImageVersionDependencyType,
  ImageVersionSelectOptionObjectType,
} from './types';
import { StartNotebookData, StorageData } from '../../types';

/******************* Common utils *******************/
export const getVersion = (version?: string, prefix?: string): string => {
  if (!version) {
    return '';
  }
  const versionString =
    version.startsWith('v') || version.startsWith('V') ? version.slice(1) : version;

  return `${prefix ? prefix : ''}${versionString}`;
};

export const getNameVersionString = (software: ImageVersionDependencyType): string =>
  `${software.name}${getVersion(software.version, ' v')}`;

/******************* PF Select related utils *******************/
/**
 * Create object for PF Select component to use
 * `toString` decides the text shown for the select option
 */
export const getImageStreamSelectOptionObject = (
  imageStream: ImageStreamKind,
): ImageStreamSelectOptionObjectType => ({
  imageStream,
  toString: () => getImageStreamDisplayName(imageStream),
});
export const getImageVersionSelectOptionObject = (
  imageStream: ImageStreamKind,
  imageVersion: ImageStreamSpecTagType,
): ImageVersionSelectOptionObjectType => ({
  imageVersion,
  toString: () =>
    `${getImageStreamDisplayName(imageStream)} ${imageVersion.name}${
      checkVersionRecommended(imageVersion) ? ' (Recommended)' : ''
    }`,
});
export const isImageStreamSelectOptionObject = (
  object: unknown,
): object is ImageStreamSelectOptionObjectType => {
  return (object as ImageStreamSelectOptionObjectType).imageStream !== undefined;
};
export const isImageVersionSelectOptionObject = (
  object: unknown,
): object is ImageVersionSelectOptionObjectType => {
  return (object as ImageVersionSelectOptionObjectType).imageVersion !== undefined;
};

/******************* Compare utils for sorting *******************/
const getBuildNumber = (build: BuildKind): number => {
  const buildNumber = build.metadata.annotations?.['openshift.io/build.number'] || '-1';
  return parseInt(buildNumber, 10);
};

export const compareBuilds = (b1: BuildKind, b2: BuildKind): number => {
  const b1Pending = PENDING_PHASES.includes(b1.status.phase);
  const b2Pending = PENDING_PHASES.includes(b2.status.phase);

  if (b1Pending && !b2Pending) {
    return -1;
  }
  if (b2Pending && !b1Pending) {
    return 1;
  }
  return getBuildNumber(b1) - getBuildNumber(b2);
};

export const compareTagVersions = (
  a: ImageStreamSpecTagType,
  b: ImageStreamSpecTagType,
): number => {
  if (compareVersions.validate(a.name) && compareVersions.validate(b.name)) {
    return compareVersions(b.name, a.name);
  }
  return b.name.localeCompare(a.name);
};

export const compareImageVersionOptionOrder = (
  a: ImageVersionSelectOptionObjectType,
  b: ImageVersionSelectOptionObjectType,
): number => compareTagVersions(a.imageVersion, b.imageVersion);

export const compareImageStreamOptionOrder = (
  a: ImageStreamSelectOptionObjectType,
  b: ImageStreamSelectOptionObjectType,
): number => getImageSteamOrder(a.imageStream) - getImageSteamOrder(b.imageStream);

/******************* ImageStream and ImageVersion utils *******************/
export const getImageStreamDisplayName = (imageStream: ImageStreamKind): string =>
  imageStream.metadata.annotations?.['opendatahub.io/notebook-image-name'] ||
  imageStream.metadata.name;

export const getImageStreamDescription = (imageStream: ImageStreamKind): string =>
  imageStream.metadata.annotations?.['opendatahub.io/notebook-image-desc'] || '';

export const getImageSteamOrder = (imageStream: ImageStreamKind): number =>
  parseInt(imageStream.metadata.annotations?.['opendatahub.io/notebook-image-order'] || '100');

/**
 * Parse annotation software field or dependencies field from long string to array
 */
export const getImageVersionDependencies = (
  imageVersion: ImageStreamSpecTagType,
  isSoftware: boolean,
): ImageVersionDependencyType[] => {
  const depString = isSoftware
    ? imageVersion.annotations?.['opendatahub.io/notebook-software'] || ''
    : imageVersion.annotations?.['opendatahub.io/notebook-python-dependencies'] || '';
  let dependencies = [];
  try {
    dependencies = JSON.parse(depString);
  } catch (e) {
    console.error(`JSON parse error when parsing ${imageVersion.name}`);
    dependencies = [];
  }
  return dependencies || [];
};

/**
 * Get the long string of the software that the version is using
 */
export const getImageVersionSoftwareString = (imageVersion: ImageStreamSpecTagType): string => {
  const dependencies = getImageVersionDependencies(imageVersion, true);
  const softwareString = dependencies.map((software) => getNameVersionString(software));
  return softwareString.join(', ');
};

/**
 * Get all the `imageStream.spec.tags` and filter the ones exists in `imageStream.status.tags`
 */
export const getExistingVersionsForImageStream = (
  imageStream: ImageStreamKind,
): ImageStreamSpecTagType[] => {
  const allVersions = imageStream.spec.tags || [];
  return allVersions.filter((version) => checkVersionExistence(imageStream, version));
};

/**
 * Get all the existing tags and check their build status, filter out the available ones
 */
export const getAvailableVersionsForImageStream = (
  imageStream: ImageStreamKind,
  buildStatuses: BuildStatus[],
): ImageStreamSpecTagType[] => {
  const existingVersions = getExistingVersionsForImageStream(imageStream);
  return existingVersions.filter((version) =>
    checkTagBuildValid(buildStatuses, imageStream, version),
  );
};

/**
 * Get the recommended tag or the default tag
 * if no recommended or default, return the latest version
 */
export const getDefaultVersionForImageStream = (
  imageStream: ImageStreamKind,
  buildStatuses: BuildStatus[],
): ImageStreamSpecTagType | undefined => {
  const availableVersions = getAvailableVersionsForImageStream(imageStream, buildStatuses);
  if (availableVersions.length === 0) {
    return undefined;
  }

  const sortedVersions = [...availableVersions].sort(compareTagVersions);

  const defaultVersion = sortedVersions.find(
    (version) =>
      version.annotations?.['opendatahub.io/notebook-image-recommended'] ||
      version.annotations?.['opendatahub.io/default-image'],
  );
  if (defaultVersion) {
    return defaultVersion;
  }

  // Return the most recent version
  return sortedVersions[0];
};

/******************* Deployment Size utils *******************/
export const getSizeDescription = (size: NotebookSize): string =>
  `Limits: ${size.resources.limits?.cpu || '??'} CPU, ` +
  `${size.resources.limits?.memory || '??'} Memory ` +
  `Requests: ${size.resources.requests?.cpu || '??'} CPU, ` +
  `${size.resources.requests?.memory || '??'} Memory`;

/******************* Storage utils *******************/
export const getVolumesByStorageData = (
  storageData: StorageData,
): { volumes: Volume[]; volumeMounts: VolumeMount[] } => {
  const { storageType, storageBindingType, existingObject } = storageData;
  const volumes: Volume[] = [];
  const volumeMounts: VolumeMount[] = [];
  if (storageType === 'ephemeral') {
    volumes.push({ name: 'cache-volume', emptyDir: {} });
    volumeMounts.push({ mountPath: '/cache', name: 'cache-volume' });
    return { volumes, volumeMounts };
  }
  // we will deal with new storage after creating it because the name is different
  if (storageBindingType.has('existing')) {
    const { storage } = existingObject;
    if (storage) {
      volumes.push({ name: storage, persistentVolumeClaim: { claimName: storage } });
      volumeMounts.push({ mountPath: '/opt/app-root/src', name: storage });
    }
  }

  return { volumes, volumeMounts };
};

/******************* Checking utils *******************/
/**
 * Check if there is 1 or more versions available for an image stream
 */
export const checkImageStreamAvailability = (
  imageStream: ImageStreamKind,
  buildStatuses: BuildStatus[],
): boolean => {
  const tags = getAvailableVersionsForImageStream(imageStream, buildStatuses);
  return tags.length !== 0;
};

export const checkTagBuildValid = (
  buildStatuses: BuildStatus[],
  imageStream: ImageStreamKind,
  imageVersion: ImageStreamSpecTagType,
): boolean => {
  const imageStreamVersion = `${imageStream.metadata.name}:${imageVersion.name}`;
  const build = buildStatuses.find(
    (buildStatus) => buildStatus.imageStreamVersion === imageStreamVersion,
  );
  if (!build) {
    return true;
  }
  return !PENDING_PHASES.includes(build.status) && !FAILED_PHASES.includes(build.status);
};

/**
 * Check whether `imageStream.spec.tags[i]` exists in status.tags
 */
export const checkVersionExistence = (
  imageStream: ImageStreamKind,
  imageVersion: ImageStreamSpecTagType,
): boolean => {
  const versions = imageStream.status?.tags || [];
  for (let i = 0; i < versions.length; i++) {
    if (versions[i].tag === imageVersion.name) {
      return true;
    }
  }
  return false;
};

/**
 * Check whether a version is recommended
 */
export const checkVersionRecommended = (imageVersion: ImageStreamSpecTagType): boolean =>
  !!imageVersion.annotations?.['opendatahub.io/notebook-image-recommended'];

export const checkRequiredFieldsForNotebookStart = (
  startNotebookData: StartNotebookData,
  storageData: StorageData,
): boolean => {
  const { projectName, notebookName, username, notebookSize, image } = startNotebookData;
  const { storageType, storageBindingType, creatingObject, existingObject } = storageData;
  const isNotebookDataValid = !!(
    projectName &&
    notebookName &&
    username &&
    notebookSize &&
    image.imageStream &&
    image.imageVersion
  );
  // if you choose pvc and don't choose binding type, that's invalid
  // if you choose creating new pvc, you need to input name
  // if you choose add existing pvc, you need to select storage name
  // other situations are valid
  const isStorageDataValid = !(
    storageType === 'persistent' &&
    (storageBindingType.size === 0 ||
      (storageBindingType.has('new') && !creatingObject.name) ||
      (storageBindingType.has('existing') && !existingObject.storage))
  );
  return isNotebookDataValid && isStorageDataValid;
};