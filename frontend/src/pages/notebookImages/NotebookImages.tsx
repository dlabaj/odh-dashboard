  import * as React from 'react';
import * as _ from 'lodash-es';
import {
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateBody,
  PageSection,
  PageSectionVariants,
  Title
} from '@patternfly/react-core';
import ApplicationsPage from '../ApplicationsPage';
import { Notebook } from '../../types';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../redux/actions/actions';
import { useWatchNotebookImages } from '../../utilities/useWatchNotebookImages';
import './NotebookImages.scss';
import { PlusCircleIcon } from '@patternfly/react-icons'
import { ImportImageModal, ImportImageModalProps } from './ImportImageModal';
import { NotebookImagesTable } from './NotebookImagesTable';

const description = `Import, delete, and modify notebook images.`;

const NotebookImages: React.FC = () => {
  
  // const [loaded, setLoaded] = React.useState<boolean>(false);
  // const [loadError, setLoadError] = React.useState<Error>();
  const [importImageModalVisible, setImportImageModalVisible] = React.useState<boolean>(false);
  //const [NotebookImages, setNoteImages] = React.useState(Array<Notebook>());
  const dispatch = useDispatch();

  const {notebooks, loaded, loadError} = useWatchNotebookImages();
  const isEmpty = !notebooks || notebooks.length === 0;

  React.useEffect(() => {
    // fetchClusterSettings()
    //     .then((NotebookImages: NotebookImages) => {
    //         setLoaded(true);
    //         setLoadError(undefined);
    //         setClusterSettings(NotebookImages);
    //         setPvcSize(NotebookImages.pvcSize);
    //     })
    //     .catch((e) => {
    //         setLoadError(e);
    //     });
  }, []);

  const noNotebooksPageSection = <PageSection isFilled>
    <EmptyState variant={EmptyStateVariant.full} data-test-id="empty-empty-state">
      <EmptyStateIcon icon={PlusCircleIcon} />
      <Title headingLevel="h5" size="lg">
        No custom notebook images found.
      </Title>
      <EmptyStateBody>
        To get started import a custom notebook image.
      </EmptyStateBody>
      <Button variant={ButtonVariant.primary} onClick={()=>{setImportImageModalVisible(true)}}>Import image</Button>
    </EmptyState>
    <ImportImageModal isOpen={importImageModalVisible} onCloseHandler={() => { setImportImageModalVisible(false); }} onImportHandler={(name, repository, description) => { }} />
  </PageSection>

  return (
    <ApplicationsPage
      title="Notebook image settings"
      description={description}
      loaded={loaded}
      empty={isEmpty}
      loadError={loadError}
      errorMessage="Unable to load Notebook images."
      emptyStatePage={noNotebooksPageSection}
    >
      {!isEmpty ? (
        <div className="odh-cluster-settings">
          <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
            <Flex direction={{ default: 'column' }}>
              <FlexItem> <NotebookImagesTable notebooks={notebooks}/></FlexItem>
            </Flex>
          </PageSection>
        </div>
      ) : null}
    </ApplicationsPage>
  );
};


export default NotebookImages;
