import { PathExt } from '@jupyterlab/coreutils';
import {
  caretDownIcon,
  caretUpIcon,
  refreshIcon
} from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import { Tab, Tabs } from '@material-ui/core';
import * as React from 'react';
import { classes } from 'typestyle';
import { CommandIDs } from '../commandsAndMenu';
import { Logger } from '../logger';
import {
  selectedTabClass,
  tabClass,
  tabIndicatorClass,
  tabsClass
} from '../style/GitPanel';
import { branchIcon, desktopIcon, pullIcon, pushIcon } from '../style/icons';
import {
  spacer,
  toolbarButtonClass,
  toolbarClass,
  toolbarMenuButtonClass,
  toolbarMenuButtonEnabledClass,
  toolbarMenuButtonIconClass,
  toolbarMenuButtonSubtitleClass,
  toolbarMenuButtonTitleClass,
  toolbarMenuButtonTitleWrapperClass,
  toolbarMenuWrapperClass,
  toolbarNavClass
} from '../style/Toolbar';
import { Git, IGitExtension, Level } from '../tokens';
import { ActionButton } from './ActionButton';
import { BranchMenu } from './BranchMenu';
import { TagMenu } from './TagMenu';

/**
 * Interface describing component properties.
 */
export interface IToolbarProps {
  /**
   * Current list of branches.
   */
  branches: Git.IBranch[];

  /**
   * Boolean indicating whether branching is disabled.
   */
  branching: boolean;

  /**
   * Jupyter App commands registry
   */
  commands: CommandRegistry;

  /**
   * Current branch name.
   */
  currentBranch: string;

  /**
   * Extension logger
   */
  logger: Logger;

  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * Current repository.
   */
  repository: string;

  /**
   * Callback to invoke in order to refresh a repository.
   *
   * @returns promise which refreshes a repository
   */
  refresh: () => Promise<void>;
}

/**
 * Interface describing component state.
 */
export interface IToolbarState {
  /**
   * Boolean indicating whether a branch menu is shown.
   */
  branchMenu: boolean;

  /**
   * Panel tab identifier.
   */
  tab: number;
}

/**
 * React component for rendering a panel toolbar.
 */
export class Toolbar extends React.Component<IToolbarProps, IToolbarState> {
  /**
   * Returns a React component for rendering a panel toolbar.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IToolbarProps) {
    super(props);

    this.state = {
      branchMenu: false,
      tab: 0
    };
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div className={toolbarClass}>
        {this._renderTopNav()}
        {this._renderRepoMenu()}
        {this._renderBranchMenu()}
      </div>
    );
  }

  /**
   * Renders the top navigation.
   *
   * @returns React element
   */
  private _renderTopNav(): React.ReactElement {
    return (
      <div className={toolbarNavClass}>
        <span className={spacer} />
        <ActionButton
          className={toolbarButtonClass}
          icon={pullIcon}
          onClick={this._onPullClick}
          title={'Pull latest changes'}
        />
        <ActionButton
          className={toolbarButtonClass}
          icon={pushIcon}
          onClick={this._onPushClick}
          title={'Push committed changes'}
        />
        <ActionButton
          className={toolbarButtonClass}
          icon={refreshIcon}
          onClick={this._onRefreshClick}
          title={'Refresh the repository to detect local and remote changes'}
        />
      </div>
    );
  }

  /**
   * Renders a repository menu.
   *
   * @returns React element
   */
  private _renderRepoMenu(): React.ReactElement {
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          disabled
          className={toolbarMenuButtonClass}
          title={`Current repository: ${this.props.repository}`}
        >
          <desktopIcon.react className={toolbarMenuButtonIconClass} />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>Current Repository</p>
            <p className={toolbarMenuButtonSubtitleClass}>
              {PathExt.basename(this.props.repository)}
            </p>
          </div>
        </button>
      </div>
    );
  }

  /**
   * Renders a branch menu.
   *
   * @returns React element
   */
  private _renderBranchMenu(): React.ReactElement | null {
    if (!this.props.model.pathRepository) {
      return null;
    }
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          className={classes(
            toolbarMenuButtonClass,
            toolbarMenuButtonEnabledClass
          )}
          title={'Manage branches and tags'}
          onClick={this._onBranchClick}
        >
          <branchIcon.react className={toolbarMenuButtonIconClass} />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>Current Branch</p>
            <p className={toolbarMenuButtonSubtitleClass}>
              {this.props.currentBranch || ''}
            </p>
          </div>
          {this.state.branchMenu ? (
            <caretUpIcon.react className={toolbarMenuButtonIconClass} />
          ) : (
            <caretDownIcon.react className={toolbarMenuButtonIconClass} />
          )}
        </button>
        {this.state.branchMenu ? this._renderTabs() : null}
      </div>
    );
  }

  private _renderTabs(): JSX.Element {
    return (
      <React.Fragment>
        <Tabs
          classes={{
            root: tabsClass,
            indicator: tabIndicatorClass
          }}
          value={this.state.tab}
          onChange={(event: any, tab: number): void => {
            this.setState({
              tab: tab
            });
          }}
        >
          <Tab
            classes={{
              root: tabClass,
              selected: selectedTabClass
            }}
            title="View branches"
            label="Branches"
            disableFocusRipple={true}
            disableRipple={true}
          ></Tab>
          <Tab
            classes={{
              root: tabClass,
              selected: selectedTabClass
            }}
            title="View tags"
            label="Tags"
            disableFocusRipple={true}
            disableRipple={true}
          ></Tab>
        </Tabs>
        {this.state.tab === 0 ? this._renderBranches() : this._renderTags()}
      </React.Fragment>
    );
  }

  private _renderBranches(): JSX.Element {
    return (
      <BranchMenu
        currentBranch={this.props.currentBranch || ''}
        branches={this.props.branches}
        branching={this.props.branching}
        logger={this.props.logger}
        model={this.props.model}
      />
    );
  }

  private _renderTags(): JSX.Element {
    return (
      <TagMenu
        logger={this.props.logger}
        model={this.props.model}
        branching={this.props.branching}
      ></TagMenu>
    );
  }

  /**
   * Callback invoked upon clicking a button to pull the latest changes.
   *
   * @param event - event object
   * @returns a promise which resolves upon pulling the latest changes
   */
  private _onPullClick = async (): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPull);
  };

  /**
   * Callback invoked upon clicking a button to push the latest changes.
   *
   * @param event - event object
   * @returns a promise which resolves upon pushing the latest changes
   */
  private _onPushClick = async (): Promise<void> => {
    await this.props.commands.execute(CommandIDs.gitPush);
  };

  /**
   * Callback invoked upon clicking a button to change the current branch.
   *
   * @param event - event object
   */
  private _onBranchClick = (): void => {
    // Toggle the branch menu:
    this.setState({
      branchMenu: !this.state.branchMenu
    });
  };

  /**
   * Callback invoked upon clicking a button to refresh a repository.
   *
   * @param event - event object
   * @returns a promise which resolves upon refreshing a repository
   */
  private _onRefreshClick = async (): Promise<void> => {
    this.props.logger.log({
      level: Level.RUNNING,
      message: 'Refreshing...'
    });
    try {
      await this.props.refresh();

      this.props.logger.log({
        level: Level.SUCCESS,
        message: 'Successfully refreshed.'
      });
    } catch (error) {
      console.error(error);
      this.props.logger.log({
        level: Level.ERROR,
        message: 'Failed to refresh.',
        error
      });
    }
  };
}
