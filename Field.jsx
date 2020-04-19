import React from 'react';
import PropTypes from 'prop-types';


/**
 * React component for a field, it packages together a label around the child
 * component that handles the actual editing. It also supports an error message
 * below the child component.
 * @class
 */
export function Field(props) {
    const { label, id, errorMsg, editorClassExtras, onRenderEditor } = props;

    const divClassName = 'form-group';
    
    let labelComponent;
    if (label) {
        labelComponent = <label htmlFor={id}>{label}</label>;
    }

    let editorClassName = 'form-control ' + (editorClassExtras || '');

    let errorMsgComponent;
    if (errorMsg) {
        editorClassName += ' is-invalid';
        errorMsgComponent = <div className="invalid-feedback">
            {errorMsg}
        </div>;
    }

    let prepend;
    if (props.prependComponent) {
        prepend = <div className="input-group-prepend">
            {props.prependComponent}
        </div>;
    }

    let append;
    if (props.appendComponent) {
        append = <div className="input-group-append">
            {props.appendComponent}
        </div>;
    }

    if (prepend || append) {
        editorClassName += ' field-input-form-control';
    }

    let inputComponent = onRenderEditor(editorClassName);
    if (prepend || append) {
        inputComponent = <div className="input-group">
            {prepend}
            {inputComponent}
            {append}
        </div>;
    }

    return <div className={divClassName}>
        {labelComponent}
        {inputComponent}
        {errorMsgComponent}
    </div>;
}


/**
 * @callback {Field~onRenderEditor}
 * @param {string}  className
 */


/**
 * @typedef {object} Field~propTypes
 * @property {string}   [label]
 * @property {string}   [errorMsg]  If specified an error message to be displayed
 * below the input box.
 * @property {string}   [editorClassExtras]  If specified additional CSS
 * classes to add to the editor entity.
 * @property {Field~onRenderEditor} onRenderEditor  Callback for rendering the
 * editor component. We use a callback so we can pass in a modified editorClassName
 * if there's an error message.
 */
Field.propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    errorMsg: PropTypes.string,
    editorClassExtras: PropTypes.string,
    onRenderEditor: PropTypes.func.isRequired,
    prependComponent: PropTypes.object,
    appendComponent: PropTypes.object,
};