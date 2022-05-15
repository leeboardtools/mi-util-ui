import React from 'react';
import PropTypes from 'prop-types';
import { Field } from './Field';
import { WhenEditor } from './WhenEditor';


/**
 * React component for editing a {@link When} in a {@link Field}
 * @class
 */
export const WhenField = React.forwardRef(
    function WhenFieldImpl(props, ref) {
        const { label, id, fieldClassExtras, inputClassExtras, errorMsg, 
            ...editorProps } = props;
        const editor = <WhenEditor
            classExtras = {inputClassExtras}
            {...editorProps}
            ref = {ref}
        />;

        return <Field
            id={id}
            label={label}
            errorMsg={errorMsg}
            fieldClassExtras = {fieldClassExtras}
            editorClassExtras={'Field-editor WhenField-editor' 
                + (inputClassExtras || '')}
            onRenderEditor={() => editor}
            prependComponent={props.prependComponent}
            appendComponent={props.appendComponent}
        />;
    }
);


/**
 * @typedef {object} WhenField~propTypes
 * @property {string}   [ariaLabel]
 * @property {string}   [label]
 * @property {string}   [value]
 * @property {string}   [fieldClassExtras]
 * @property {string}   [inputClassExtras]  If specified additional CSS
 * classes to add to the {@link DropdownSelector}.
 * @property {string}   [errorMsg]  If specified an error message to be displayed
 * below the input box.

 * @property {function} [onFocus]   onFocus event handler
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onfocus}.
 * @property {function} [onBlur]    onBlur event handler
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onblur}.
 * @property {boolean}  [disabled]  If <code>true</code> the editor is disabled.
 */
WhenField.propTypes = {
    id: PropTypes.string,
    ariaLabel: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.object,
    fieldClassExtras: PropTypes.string,
    inputClassExtras: PropTypes.string,
    errorMsg: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    datePartFormatter: PropTypes.object,
    timePartFormatter: PropTypes.object,
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    prependComponent: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),
    appendComponent: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),
};

/*
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
*/