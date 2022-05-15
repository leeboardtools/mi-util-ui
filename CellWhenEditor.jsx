import React from 'react';
import PropTypes from 'prop-types';
import { WhenEditor } from './WhenEditor';


export const CellWhenDisplay = React.forwardRef(
    function CellWhenDisplayImpl(props, ref) {
        const { ...passThroughProps } = props;

        return <WhenEditor {...passThroughProps}
            allClassExtras = "CellWhen"
            readOnly = {true}
            ref = {ref}
        />;
    }
);
    
CellWhenDisplay.propTypes = {
    id: PropTypes.string,
    ariaLabel: PropTypes.string,
    value: PropTypes.object,
    inputClassExtras: PropTypes.string,
    size: PropTypes.number,
    datePartFormatter: PropTypes.object,
    timePartFormatter: PropTypes.object,
};


export const CellWhenEditor = React.forwardRef(
    function CellWhenDisplayImpl(props, ref) {
        const { ...passThroughProps } = props;

        return <WhenEditor {...passThroughProps}
            allClassExtras = "CellWhen"
            readOnly = {false}
            ref = {ref}
        />;
    }
);

CellWhenEditor.propTypes = {
    id: PropTypes.string,
    ariaLabel: PropTypes.string,
    value: PropTypes.object,
    inputClassExtras: PropTypes.string,
    size: PropTypes.number,
    errorMsg: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    datePartFormatter: PropTypes.object,
    timePartFormatter: PropTypes.object,
};
