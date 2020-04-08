import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import LinearProgress from '@material-ui/core/LinearProgress';
import FolderIcon from '@material-ui/icons/Folder';
import RefreshIcon from '@material-ui/icons/Refresh';
import { ContextMenuItem, useContextMenu } from '../../components/context-menu';
import Page from '../../components/page';
import { FsEntry, parseFsEntry, useDuckList } from '../../api/list';
import css from './style.scss';

/*
TODO:
 - handle pathname changes
 - display last modified, permissions
 - context menu  https://www.electronjs.org/docs/api/menu
    - mkdir
    - chmod
    - copy
    - download
    - delete
    - edit
 - open logs on menu-click
 - select more than one item in the list (check google photos to figure out mechanic)
   - double click to open a folder
   - click = select this one,
   - ctrl + click = ?
   - alt + click = ?
   - shift + click = ?
 - drag & drop file to upload
   - when dragging above a file or nothing, display "upload to /"
   - when dragging above a folder, display "upload to /folder-name"
 - FAB button for upload
 - list of files currently uploading
 - list of files currently downloading
 - list of servers
 - connect to another server
 - not connected to any server page state
 - sorting list
 - drag & drop items to move them to other folders
 - virtualize list for HUGE content like assets.mmc.li/images
 - compact list mode
 */

const path = window.require('path');
const { ipcRenderer } = window.require('electron');

export default function ServerFsView() {
  const uri = ''; // TODO
  const [cwd, setCwd] = React.useState('/');

  const res = useDuckList({
    uri,
    username: '', // TODO
    password: '', // TODO
    pathname: cwd,
  });

  const data = res.data;
  const entries = React.useMemo(() => {
    if (!data) {
      return [];
    }

    return data.split('\n')
      .map(parseFsEntry)
      .filter(item => item != null)
      .sort((a, b) => {
        if (a.isDir !== b.isDir) {
          if (a.isDir) {
            return -1;
          }

          if (b.isDir) {
            return 1;
          }
        }

        return a.name.localeCompare(b.name);
      });
  }, [data]);

  React.useEffect(() => {
    const listener = (_event, arg) => {
      console.log(arg);
    };

    ipcRenderer.on('menu-click', listener);

    return () => {
      ipcRenderer.removeListener('menu-click', listener);
    };
  }, []);

  useContextMenu(e => {
    const menu = [];

    if (e.target.closest('[data-fs-entry]') != null) {
      menu.push(
        new ContextMenuItem({
          label: 'Open With', // TODO: 'Delete all 3 items if selecting more than 1
        }),
        new ContextMenuItem({
          label: 'Download', // TODO: 'Download all 3 items if selecting more than 1
        }),
        new ContextMenuItem({ type: 'separator' }),
        new ContextMenuItem({
          label: 'Delete', // TODO: 'Delete all 3 items if selecting more than 1
        }),
        new ContextMenuItem({
          label: 'Copy To', // TODO: 'Copy all 3 items if selecting more than 1
        }),
        new ContextMenuItem({
          label: 'Duplicate', // TODO: 'Copy all 3 items if selecting more than 1
        }),
        new ContextMenuItem({
          label: 'Move To', // TODO: 'Copy all 3 items if selecting more than 1
        }),
      );
    }

    if (e.target.closest('[data-area="file-system"]')) {
      if (menu.length > 0) {
        menu.push(new ContextMenuItem({ type: 'separator' }));
      }

      menu.push(
        new ContextMenuItem({
          label: 'New Folder',
        }),
        new ContextMenuItem({
          label: 'Upload',
        }),
      );
    }

    return menu;
  }, []);

  // TODO use history state
  function clickEntry(entry: FsEntry) {
    if (entry.isDir) {
      setCwd(oldCwd => `${oldCwd + entry.name}/`);
    }
  }

  function goUp() {
    setCwd(oldCwd => path.dirname(oldCwd));
  }

  function refresh() {
    res.refetch();
  }

  /*
  // TODO: logs
  // - open through action menu (file -> logs)
  <pre className={css.logOutput}>
    Query Status: {res.status}
    {'\n\n'}

    Log:
    {data}
  </pre>
   */

  return (
    <Page>
      <div className={css.actionBar}>
        <IconButton
          title="Refresh"
          onClick={refresh}
          color="inherit"
          disabled={res.isFetching}
          classes={{
            disabled: css.disabledRefreshBtn,
          }}
        >
          <RefreshIcon />
        </IconButton>
        <form className={css.changeCwdForm}>
          <span>{uri}</span>
          <input name="cwd" value={cwd} className={css.cwdInput} />
        </form>
      </div>

      <div className={css.activityBarWrapper}>
        {res.isFetching && <LinearProgress className={css.activityBar} />}
      </div>

      <div data-area="file-system" className={css.fsArea}>
        <List>
          {cwd !== '/' && (
            <ListItem className={css.fsEntry} button onClick={goUp}>
              <ListItemIcon className={css.fsEntryIcon}>
                <FolderIcon color="inherit" />
              </ListItemIcon>
              <ListItemText
                primary=".."
              />
            </ListItem>
          )}
          {entries.map(entry => {
            return (
              <ListItem
                key={entry.name}
                className={css.fsEntry}
                button
                onClick={() => clickEntry(entry)}
                data-fs-entry={entry.name}
              >
                <ListItemIcon className={css.fsEntryIcon}>
                  {entry.isDir && (
                    <FolderIcon color="inherit" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={entry.name}
                />
              </ListItem>
            );
          })}
        </List>
      </div>
    </Page>
  );
}