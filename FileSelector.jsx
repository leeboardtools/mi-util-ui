import React from 'react';
import PropTypes from 'prop-types';
import { userMsg } from '../util/UserMessages';
import { asyncDirExists, splitDirs, makeValidFileName, 
    asyncGetAvailableDrives } from '../util/Files';
import folder from '../images/folder.png';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { CloseButton } from './CloseButton';
import { TextField } from './TextField';
import { QuestionPrompter, StandardButton } from './QuestionPrompter';
import { DropdownField } from './DropdownField';



let networkPaths = [];

export function setNetworkPaths(paths) {
    if (!Array.isArray(paths)) {
        networkPaths = [ paths ];
    }
    else {
        networkPaths = Array.from(paths);
    }
}


/**
 * A component for selecting files or folders.
 * <p>
 * A word about nomenclature:
 * <li>Path Name: The full path name
 * <li>Dir Name: The portion before the last name in the full path.
 * <li>File Name: The last name in the full path.
 * <p>
 * pathName = path.join(dirName, fileName)
 */
export class FileSelector extends React.Component {
    constructor(props) {
        super(props);

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onOK = this.onOK.bind(this);
        this.onSelectParentDir = this.onSelectParentDir.bind(this);
        this.onSelectDir = this.onSelectDir.bind(this);
        this.onDoubleClickDir = this.onDoubleClickDir.bind(this);
        this.onSelectFile = this.onSelectFile.bind(this);
        this.onDoubleClickFile = this.onDoubleClickFile.bind(this);
        this.onFileNameChange = this.onFileNameChange.bind(this);
        this.onFileFilterChange = this.onFileFilterChange.bind(this);
        this.onDriveChange = this.onDriveChange.bind(this);

        this._firstFocusRef = React.createRef();

        this.state = {
            // The current directory from which asyncUpdateCurrentDirList() loads.
            currentDir: '.',

            // currentDirPath is currentDir expanded into a full path name by
            // asyncUpdateCurrentDirList().

            // The FileSelector~dirEnt arrays loaded by asyncUpdateCurrentDirList().
            dirs: [],
            files: [],

            // This is the value currently displayed in the file name editor.
            fileNameEditorValue: props.initialName,

            // activePathName indicates the selected file/directory in the file list.

            // selectedFileFilter is the entry of the selected fileFilter entry.
        };

        const { fileFilters, initialFileFilter } = props;
        if (fileFilters && fileFilters.length) {
            // Handle delayed loading of the standard filters...
            fileFilters.forEach((filter) => {
                const label = filter[1];
                if ((typeof label === 'object')
                 && (typeof label.userMsgId === 'string')) {
                    filter[1] = userMsg(label.userMsgId);
                }
            });

            this.state.selectedFileFilter = fileFilters[0];
            if (initialFileFilter) {
                for (let i = 0; i < fileFilters.length; ++i) {
                    if (initialFileFilter === fileFilters[i][0]) {
                        this.state.selectedFileFilter = fileFilters[i];
                        break;
                    }
                }
            }
        }

        process.nextTick(async () => {
            const { initialDir } = props;
            if (await asyncDirExists(initialDir)) {
                this.setState({
                    currentDir: initialDir,
                });
            }

            await this.asyncUpdateCurrentDirList();
        });
    }


    componentDidMount() {
        const { current } = this._firstFocusRef;
        if (current && (typeof current.focus === 'function')) {
            current.focus();
        }
    }


    async asyncUpdateCurrentDirList() {
        const { currentDir } = this.state;
        try {
            const { onFilterDirEnt } = this.props;
            const currentDirPath = await fsPromises.realpath(currentDir);
            const entries = await fsPromises.readdir(currentDir, { withFileTypes: true });

            const hostnames = new Set();

            let availableDrives = await asyncGetAvailableDrives();
            if (availableDrives && !availableDrives.length) {
                availableDrives = undefined;
            }
            if (availableDrives) {
                if (networkPaths && networkPaths.length) {
                    for await (let networkPath of networkPaths) {
                        try {
                            networkPath = path.normalize(networkPath);
                            if (networkPath.lastIndexOf(path.sep) 
                                === (networkPath.length - 1)) {
                                networkPath = networkPath.slice(0, 
                                    networkPath.length - 1);
                            }
                            
                            const stat = await fsPromises.stat(networkPath + '\\');
                            if (stat.isDirectory()) {
                                availableDrives.push(networkPath);
                                const dirParts = splitDirs(networkPath);
                                if (!dirParts[0] && dirParts[1]) {
                                    hostnames.add(dirParts[1]);
                                }
                            }
                        }
                        catch (e) {
                            //
                        }
                    }
                }
            }

            const currentDirParts = splitDirs(currentDirPath);

            if (currentDirParts && currentDirParts.length) {
                if (availableDrives) {
                    // currentDirParts[0] should be the drive letter such as 'C:'
                    if (!currentDirParts[0] && hostnames.has(currentDirParts[1])) {
                        currentDirParts[0] = '\\\\' + currentDirParts[1] 
                            + '\\' + currentDirParts[2];
                        currentDirParts.splice(1, 2);
                    }
                }
                else {
                    // Need to add the root path...
                    if ((currentDirParts.length === 1) && !(currentDirParts[0])) {
                        // currentDirPath is the root...
                        currentDirParts[0] = path.sep;
                    }
                    else {
                        currentDirParts.splice(0, 0, path.sep);
                    }
                }
            }

            const dirs = [];
            const files = [];
            entries.forEach((dirEnt) => {
                if (dirEnt.name[0] === '.') {
                    return;
                }
                if (onFilterDirEnt && !onFilterDirEnt(dirEnt, currentDirPath)) {
                    return;
                }
                if (dirEnt.isDirectory()) {
                    dirs.push(dirEnt);
                }
                else if (dirEnt.isFile()) {
                    files.push(dirEnt);
                }
            });

            let { activePathName } = this.state;
            if (!activePathName && !this.props.isCreateFile) {
                if (files && files.length) {
                    activePathName = path.join(currentDirPath, files[0].name);
                    this.onSelectFile(activePathName);
                }
                else if (dirs && dirs.length) {
                    activePathName = path.join(currentDirPath, dirs[0].name);
                    this.onSelectDir(activePathName);
                }
            }

            this.setState({
                dirs: dirs,
                files: files,
                currentDirPath: currentDirPath,
                availableDrives: availableDrives,
                currentDirParts: currentDirParts,
            });
        }
        catch (e) {
            console.log('error! ' + e);

            this.setState({
                errorMsg: userMsg('FileSelector-readdir_failed', currentDir, e),
            });
        }
    }


    onOK() {
        const { activePathName, currentDirPath, fileNameEditorValue } = this.state;
        let fullPathName;
        if (fileNameEditorValue) {
            fullPathName = path.join(currentDirPath, 
                makeValidFileName(fileNameEditorValue));
        }
        else {
            fullPathName = activePathName || currentDirPath;
        }

        if (this.props.isCreateFile && this.props.isConfirmReplaceFile) {
            // Handle the case of the file existing...
            if (!this._isValidatingFileName) {
                this._isValidatingFileName = true;

                fsPromises.stat(fullPathName)
                    .then((stat) => {
                        // Put up the confirmation box...
                        const title = userMsg('FileSelector-confirmReplace_title');
                        const message = userMsg('FileSelector-confirmRelace_message',
                            fileNameEditorValue);
                        this.setState({
                            modal: () => <QuestionPrompter
                                title = {title}
                                message = {message}
                                onButton = {(buttonId) => {
                                    this._isValidatingFileName = false;
                                    this.setState({
                                        modal: undefined,
                                    });

                                    if (buttonId === 'yes') {
                                        this.props.onOK(fullPathName);
                                    }
                                }}
                                buttons = {StandardButton.YES_NO}
                            />,
                        });
                    })
                    .catch((e) => {
                        this._isValidatingFileName = false;
                        if (e.code === 'ENOENT') {
                            // We're good to go...
                            this.props.onOK(fullPathName);
                        }
                        else {
                            console.log('Error checking if "' 
                                + fullPathName + '" exists. ' + e);
                        }
                    });
            }
            return;
        }
        
        this.props.onOK(fullPathName);
    }


    onKeyDown(e) {
        switch (e.key) {
        case 'Escape' :
            this.props.onCancel();
            break;
        }
    }


    onSelectParentDir(dir) {
        this.setState({
            currentDir: dir,
        });
        process.nextTick(async () => await this.asyncUpdateCurrentDirList());
    }


    onSelectDir(dirName) {
        this.setState({
            activePathName: dirName,
        });

        const { onDirSelect } = this.props;
        if (onDirSelect) {
            onDirSelect(dirName);
        }
    }


    onDoubleClickDir(event, dir) {
        this.setState({
            currentDir: dir,
            activePathName: undefined,
        });
        process.nextTick(async () => await this.asyncUpdateCurrentDirList());
    }


    onSelectFile(pathName) {
        const stateChanges = {
            activePathName: pathName,
        };

        if (this.props.isCreateFile) {
            stateChanges.fileNameEditorValue = path.basename(pathName);
        }

        this.setState(stateChanges);

        const { onFileSelect } = this.props;
        if (onFileSelect) {
            onFileSelect(pathName);
        }
    }


    onDoubleClickFile(event, pathName) {
        this.onOK();
    }


    onFileNameChange(event) {
        this.setState({
            fileNameEditorValue: event.target.value,
        });
    }


    onFileFilterChange(e, value) {
        this.setState({
            selectedFileFilter: value,
        });
    }

    renderFilter() {
        const { fileFilters } = this.props;
        if (!fileFilters || !fileFilters.length) {
            return;
        }

        let { selectedFileFilter } = this.state;
        if (!selectedFileFilter) {
            selectedFileFilter = fileFilters[0];
        }

        const items = fileFilters.map((fileFilter) => {
            return {
                value: fileFilter,
                text: fileFilter[1],
            };
        });

        return <DropdownField
            fieldClassExtras = "FileSelector-fileFilter_field"
            ariaLabel = "File Type"
            items = {items}
            value = {selectedFileFilter}
            onChange = {this.onFileFilterChange}
            tabIndex = {0}
        />;
    }


    renderHeader() {
        const { title } = this.props;
        let titleComponent;
        if (title) {
            titleComponent = <h4 className="Modal-title">
                {title}
            </h4>;
        }

        return <React.Fragment>
            {titleComponent}
            <CloseButton
                onClick = {this.props.onCancel}
                tabIndex = {-1}
            />
        </React.Fragment>;
    }


    onDriveChange(e) {
        this.onSelectParentDir(e.target.value + '\\');
    }

    renderDriveComponent(name, dir, isActive) {
        let className = 'FileSelector-drive_button';
        if (isActive) {
            className += ' active';
        }

        const { availableDrives } = this.state;
        const driveComponents = [];
        availableDrives.forEach((drive) => {
            driveComponents.push(<option 
                key = {drive}
                value = {drive}
            >
                {drive}
            </option>);
        });

        return <select className = {className}
            key = {dir}
            value = {name}
            onClick = {(availableDrives.length === 1) ? this.onDriveChange : undefined}
            onChange = {this.onDriveChange}
        >
            {driveComponents}
        </select>;
    }


    renderCurrentDirComponent(name, dir, isActive) {
        let className = 'Btn Btn-outline-secondary Btn-sm FileSelector-dir_button';
        if (isActive) {
            className += ' active';
        }

        return <button type="button"
            key = {dir}
            className = {className}
            onClick = {(event) => this.onSelectParentDir(dir)}
        >
            {name}
        </button>;
    }


    renderBody() {
        const { isCreateFile } = this.props;
        const { currentDirPath, dirs, files, fileNameEditorValue,
            currentDirParts, availableDrives, } = this.state;

        const currentDirComponents = [];
        if (currentDirParts && currentDirParts.length) {
            if (availableDrives) {
                currentDirComponents.push(this.renderDriveComponent(
                    currentDirParts[0], 
                    currentDirParts[0],
                    currentDirParts.length === 1,
                ));
            }
            else {
                currentDirComponents.push(this.renderCurrentDirComponent(
                    currentDirParts[0], 
                    currentDirParts[0],
                    currentDirParts.length === 1,
                ));
            }

            let builtDir = currentDirParts[0];
            for (let i = 1; i < currentDirParts.length; ++i) {
                const part = currentDirParts[i];
                builtDir = path.join(builtDir, part);

                currentDirComponents.push(
                    this.renderCurrentDirComponent(
                        part,
                        builtDir,
                        (i + 1) === currentDirParts.length,
                    )
                );
            }
        }


        const { activePathName } = this.state;


        const entityComponents = [];
        dirs.forEach((dir) => {
            const { name } = dir;
            const pathName = path.join(currentDirPath, name);
            let className = 'List-group-item List-group-item-action';
            if (pathName === activePathName) {
                className += ' active';
            }
            const component = <a href="#" key = {name}
                className = {className}
                onClick = {() => this.onSelectDir(pathName)}
                onDoubleClick = {(event) => this.onDoubleClickDir(event, pathName)}
            >
                <div className="Media">
                    <img src = {folder} className="Mr-1"></img>
                    <div className="Media-body">
                        {name}
                    </div>
                </div>
            </a>;
            entityComponents.push(component);
        });


        const { selectedFileFilter } = this.state;
        let selectedExt;
        if (selectedFileFilter) {
            if (selectedFileFilter[0] !== '*') {
                selectedExt = '.' + selectedFileFilter[0];
            }
        }

        files.forEach((file) => {
            const { name } = file;
            if (selectedExt) {
                if (path.extname(name) !== selectedExt) {
                    return;
                }
            }

            const pathName = path.join(currentDirPath, name);
            let className = 'List-group-item List-group-item-action';
            if (pathName === activePathName) {
                className += ' active';
            }
            const component = <li key = {name}
                className = {className}
                onClick = {() => this.onSelectFile(pathName)}
                onDoubleClick = {(event) => this.onDoubleClickFile(event, pathName)}
            >
                {name}
            </li>;
            entityComponents.push(component);
        });


        let fileNameComponent;
        if (isCreateFile) {
            fileNameComponent = <div className = 
                "P-2 Border-bottom W-100 FileSelector-name_bar">
                <TextField
                    ariaLabel = "File Name"
                    prependComponent = {userMsg('FileSelector-fileName_label')}
                    value = {fileNameEditorValue}
                    onChange = {this.onFileNameChange}
                    fieldClassExtras = "FileSelector-name_field"
                    tabIndex = {0}
                    ref = {this._firstFocusRef}
                />
            </div>;
        }


        let filterComponent = this.renderFilter();
        if (filterComponent) {
            filterComponent = <div className =
                "P-2 Border-top FileSelector-fileFilter_bar">
                {filterComponent}
            </div>;
        }

        return <React.Fragment>
            {fileNameComponent}
            <div className="P-2 Border-bottom FileSelector-dir_bar">
                {currentDirComponents}
            </div>
            <div className="Modal-body">
                <div className="Container-fluid Text-left FileSelector-list">
                    {entityComponents}
                </div>
            </div>
            {filterComponent}
        </React.Fragment>;
    }


    render() {
        const { modal } = this.state;
        if (modal) {
            return modal();
        }
        
        const header = this.renderHeader();
        const body = this.renderBody();

        let { okButtonText, isOKDisabled, isCreateFile,
            onGetPreFileListComponent, onGetPostFileListComponent } = this.props;
        okButtonText = okButtonText || userMsg((isCreateFile) 
            ? 'FileSelector-create'
            : 'FileSelector-open');
        
        if (isCreateFile && !isOKDisabled) {
            const { fileNameEditorValue } = this.state;
            if (fileNameEditorValue) {
                fileNameEditorValue.trim();
            }
            if (!fileNameEditorValue) {
                isOKDisabled = true;
            }
        }

        const btnClassName = 'Btn Btn-primary M-2';

        let preFileListComponent = (onGetPreFileListComponent)
            ? onGetPreFileListComponent() : undefined;
        let postFileListComponent = (onGetPostFileListComponent)
            ? onGetPostFileListComponent() : undefined;

        const className = 'Modal-dialog Modal-dialog-scrollable Modal-full-height'
            + ' FileSelector-dialog';

        return <div 
            className = {className}
            role = "document">
            <div className = "Modal-content"
                onKeyDown = {this.onKeyDown}
            >
                <div className="Modal-header">
                    {header}
                </div>
                {preFileListComponent}
                {body}
                {postFileListComponent}
                <div className = "Modal-footer">
                    <button className = {btnClassName} type="button"
                        onClick = {this.props.onCancel}
                        tabIndex = {0}
                    >
                        {userMsg('cancel')}
                    </button>
                    <button className = {btnClassName} type="button"
                        onClick = {this.onOK} 
                        disabled = {isOKDisabled}
                        tabIndex = {0}
                    >
                        {okButtonText}
                    </button>
                </div>
            </div>
        </div>;
    }
}

/**
 * @callback FileSelector~onOK
 * @param {string}  pathName
 */

/**
 * @callback FileSelector~onCancel
 */

/**
 * @typedef {object} FileSelector~dirEnt
 * This is a
 *  {@link https://nodejs.org/dist/latest-v12.x/docs/api/fs.html#fs_class_fs_dirent}
 */

/**
 * @callback FileSelector~onFilterDirEnt
 * @param {FileSelector~dirEnt}  dirEnt
 * @param {string}  pathName
 * @returns {boolean}   <code>true</code> if the dirEnt should be included/displayed.
 */

/**
 * @callback FileSelector~onDirSelect
 * @param {string}  pathName
 */

/**
 * @callback FileSelector~onFileSelect
 * @param {string}  pathName
 */

/**
 * @callback FileSelector~onGetPreFileListComponent
 * @returns {object|undefined}  The React component to display before the 
 * directory/file list.
 */

/**
 * @callback FileSelector~onGetPostFileListComponent
 * @returns {object|undefined}  The React component to display after the 
 * directory/file list.
 */


/**
 * @typedef {object} FileSelector~propTypes
 * @property {string}   [title]   The title to appear at the top.
 * @property {string}   [initialDir]    The initial folder to display.
 * @property {string} [initialName] The initial file name to display, used to fill in the
 * file name edit box when isCreateFile is true.
 * @property {FileSelector~onOK}    onOK    Called when the OK button is chosen.
 * @property {FileSelector~onCancel}    onCancel    Called when the cancel or close
 * button is chosen.
 * @property {FileSelector~onFilterDirEnt}  [onFilterDirEnt]    If defined, called
 * for each directory and file in the active directory to see if it should be
 * included in the file list.
 * @property {FileSelector~onDirSelect} [onDirSelect]   If defined, called when a
 * directory is selected (becomes active)
 * @property {FileSelector~onFileSelect}    [onFileSelect]  If defined, called when
 * a file is selected (becomes active)
 * @property {string}   [okButtonText]  Text for the OK button.
 * @property {boolean}  [isOKDisabled]  If <code>true</code> the OK button is disabled.
 * @property {FileSelector~onGetPreFileListComponent} [onGetPreFileListComponent]
 * If defined, called to retrieve the component to display before the directory/file list.
 * @property {FileSelector~onGetPostFileListComponent}  [onGetPostFileListComponent]
 * If defined, called to retrieve the component to display after the directory/file list.
 * @property {boolean} [isCreateFile=false] 
 * @property {boolean} [isConfirmReplaceFile=false]
 * @property {string[][]} [fileFilters] If specified this is an array of two element 
 * arrays of which the first element is the extension for the file filter and the second
 * element is the description.
 * @property {string} [initialFileFilter] If specified this is the initial file filter
 * to select, and is the first element of the filter. If not specified the first filter
 * in fileFilters will be selected.
 */
FileSelector.propTypes = {
    title: PropTypes.string,
    initialDir: PropTypes.string,
    initialName: PropTypes.string,
    onOK: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onFilterDirEnt: PropTypes.func,
    onDirSelect: PropTypes.func,
    onFileSelect: PropTypes.func,
    okButtonText: PropTypes.string,
    isOKDisabled: PropTypes.bool,
    onGetPreFileListComponent: PropTypes.func,
    onGetPostFileListComponent: PropTypes.func,
    isCreateFile: PropTypes.bool,
    isConfirmReplaceFile: PropTypes.bool,
    fileFilters: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]))),
    initialFileFilter: PropTypes.string,
};


export const TXTFilter = ['txt', { userMsgId: 'FileFilter-txt_description', }];
export const CSVFilter = ['csv', { userMsgId: 'FileFilter-csv_description', }];
export const XMLFilter = ['xml', { userMsgId: 'FileFilter-xml_description', }];
export const AllFilesFilter = ['*', { userMsgId: 'FileFilter-all_description', }];
