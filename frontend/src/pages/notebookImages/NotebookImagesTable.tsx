import React from 'react';
import { Switch } from '@patternfly/react-core'
import { TableComposable, Thead, Tr, Th, Tbody, Td, ExpandableRowContent } from '@patternfly/react-table';
import { Notebook } from 'types';

export type NotebookImagesTableProps = {
    notebooks: Notebook[];
}


export const NotebookImagesTable: React.FC<NotebookImagesTableProps> = ({notebooks}) => {

  
    const columnNames = {
        name: 'Name',
        description: 'Description',
        status: 'Status',
        enable: 'Enable',
        user: 'User',
        uploaded: 'Uploaded'
      };


const [expandedNotebookIDs, setExpandedNotebookIDs] = React.useState<string[]>([]);
  const setNotebookExpanded = (notebook: Notebook, isExpanding = true) => {
    setExpandedNotebookIDs(prevExpanded => {
        const otherExpandedRepoNames = prevExpanded.filter(r => r !== notebook.id);
        return isExpanding ? [...otherExpandedRepoNames, notebook.id] : otherExpandedRepoNames;
      });
  }
  const isNotebookExpanded = (notebook: Notebook) => {
      console.log("List of notebooks: " + expandedNotebookIDs.toString());
      return expandedNotebookIDs.includes(notebook.id);
  }

  return (
    <React.Fragment>
      <TableComposable aria-label="Notebook Images table" variant='compact' >
        <Thead>
          <Tr>
            <Th />
           <Th>{columnNames.name}</Th>
           <Th>{columnNames.description}</Th>
           <Th>{columnNames.status}</Th>
           <Th>{columnNames.enable}</Th>
           <Th>{columnNames.user}</Th>
           <Th>{columnNames.uploaded}</Th>
          </Tr>
        </Thead>
        {notebooks.map((notebook, rowIndex) => {
         
          return (
            <Tbody key={notebook.name} isExpanded={isNotebookExpanded(notebook)}>
              <Tr>
                <Td expand = {{
                     rowIndex,
                     isExpanded: isNotebookExpanded(notebook),
                     onToggle: () => setNotebookExpanded(notebook, !isNotebookExpanded(notebook))
                }}
                />
                <Td dataLabel={columnNames.name}>{notebook.name}</Td>
                <Td dataLabel={columnNames.description}>{notebook.description}</Td>
                <Td dataLabel={columnNames.status}>{notebook.phase}</Td>
                <Td dataLabel={columnNames.enable}><Switch
        id="simple-switch"
        isChecked={notebook.visible}
        onChange={(isChecked)=>{}}
      /></Td>
                <Td dataLabel={columnNames.user}>{notebook.user}</Td>
                <Td dataLabel={columnNames.uploaded}>{notebook.uploaded}</Td>
              </Tr>
                <Tr isExpanded={isNotebookExpanded(notebook)}>
                    <Td dataLabel="Repo detail 1" colSpan={Object.entries(columnNames).length}>
                      <ExpandableRowContent>hello world</ExpandableRowContent>
                    </Td>
                </Tr>
            </Tbody>
          );
        })}
      </TableComposable>
    </React.Fragment>
  );
};
