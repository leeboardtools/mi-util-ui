import React from 'react';
import PropTypes from 'prop-types';


/**
 * React component for a field, it packages together a label around the child
 * component that handles the actual editing. It also supports an error message
 * below the child component.
 * @class
 */
export function Field(props) {
    const { label, id, errorMsg, fieldClassExtras,
        editorClassExtras, onRenderEditor } = props;

    let divClassName = 'Form-group';
    if (fieldClassExtras) {
        divClassName = divClassName + ' ' + fieldClassExtras;
    }
    
    let labelComponent;
    if (label) {
        labelComponent = <label htmlFor={id}>{label}</label>;
    }

    let editorClassName = 'Form-control ' + (editorClassExtras || '');

    let errorMsgComponent;
    if (errorMsg) {
        editorClassName += ' Is-invalid';
        errorMsgComponent = <div className="Invalid-feedback">
            {errorMsg}
        </div>;
    }

    let prepend;
    let { prependComponent } = props;
    if (prependComponent) {
        if (typeof prependComponent === 'string') {
            prependComponent = <FieldPrefix>{prependComponent}</FieldPrefix>;
        }
        prepend = <div className="Input-group-prepend">
            {prependComponent}
        </div>;
    }

    let append;
    let { appendComponent } = props;
    if (appendComponent) {
        if (typeof appendComponent === 'string') {
            appendComponent = <FieldSuffix>{appendComponent}</FieldSuffix>;
        }
        append = <div className="Input-group-append">
            {appendComponent}
        </div>;
    }

    if (prepend || append) {
        editorClassName += ' Field-input-form-control';
    }

    let inputComponent = (onRenderEditor)
        ? onRenderEditor(editorClassName)
        : props.children;
    if (prepend || append) {
        let inputClassName = 'Input-group nowrap';
        if (errorMsg) {
            inputClassName += ' is-invalid';
        }
        inputComponent = <div className={inputClassName}>
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
 * @property {string}   [id]
 * @property {string}   [label]
 * @property {string}   [errorMsg]  If specified an error message to be displayed
 * below the input box.
 * @property {string}   [fieldClassExtras] If specified additional CSS
 * classes to add to the outer field container.
 * @property {string}   [editorClassExtras]  If specified additional CSS
 * classes to add to the editor entity.
 * @property {Field~onRenderEditor} onRenderEditor  Callback for rendering the
 * editor component. We use a callback so we can pass in a modified editorClassName
 * if there's an error message.
 * @property {object} [prependComponent] Optional component to appear before
 * the editor.
 * @property {object} [appendComponent] Optional component to appear after the editor.
 */
Field.propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    errorMsg: PropTypes.string,
    fieldClassExtras: PropTypes.string,
    editorClassExtras: PropTypes.string,
    onRenderEditor: PropTypes.func,
    children: PropTypes.any,
    prependComponent: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),
    appendComponent: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]),
};


/**
 * React component used by {@link Field} for the prependComponent if it is a string.
 */
export function FieldPrefix(props) {
    if (!props.children) {
        return null;
    }
    return <div className = "Field-inline-text Pr-2">
        {props.children}
    </div>;
}

FieldPrefix.propTypes = {
    children: PropTypes.any,
};


/**
 * React component that displays text so it can appear between {@link Field}'s
 * prependComponent and appendComponent when they're strings.
 */
export function FieldText(props) {
    if (!props.children) {
        return null;
    }
    return <div className = "Field-inline-text">
        {props.children}
    </div>;
}

FieldText.propTypes = {
    children: PropTypes.any,
};


/**
 * React component used by {@link Field} for the appendComponent if it is a string.
 */
export function FieldSuffix(props) {
    if (!props.children) {
        return null;
    }
    return <div className = "Field-inline-text Pl-2">
        {props.children}
    </div>;
}

FieldSuffix.propTypes = {
    children: PropTypes.any,
};


