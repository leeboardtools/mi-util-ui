import React from 'react';
import PropTypes from 'prop-types';
import * as W from '../util/When';
import * as DP from '../util/DatePart';
import * as TP from '../util/TimePart';
import { DatePartEditor } from './DatePartEditor';
import { TimePartEditor } from './TimePartEditor';
import { userMsg } from '../util/UserMessages';
import { setFocus } from '../util/ElementUtils';


export class WhenEditor extends React.Component {
    constructor(props) {
        super(props);

        this.onKeyDown = this.onKeyDown.bind(this);

        this.onStartDateChange = this.onStartDateChange.bind(this);
        this.onFinishDateChange = this.onFinishDateChange.bind(this);

        this.onStartTimeChange = this.onStartTimeChange.bind(this);
        this.onFinishTimeChange = this.onFinishTimeChange.bind(this);

        this.containerRef = React.createRef();
        this.startDateRef = React.createRef();
        this.finishDateRef = React.createRef();
        this.startTimeRef = React.createRef();
        this.finishTimeRef = React.createRef();

        this.state = {
        };

        this.updateFromValue(this.state);
    }


    componentDidMount() {
    }


    componentDidUpdate(prevProps, prevState) {
        const { value } = this.props;
        if (value !== prevProps.value) {
            const stateUpdates = {};
            this.updateFromValue(stateUpdates);
            this.setState(stateUpdates);
        }
    }


    updateFromValue(stateUpdates) {
        const when = W.cleanWhen(this.props.value, {
            defaults: { startDatePart: DP.datePartFromDate(new Date()), },
        }) || {};

        const finishParts = W.getFinishParts(when);

        let startDatePart = when.startDatePart;
        let startTimePart = when.startTimePart;
        let finishDatePart;
        let finishTimePart;
        if (finishParts) {
            if (!DP.areDatePartsIdentical(finishParts.finishDatePart, startDatePart)) {
                finishDatePart = finishParts.finishDatePart;
            }
            if (!TP.areTimePartsIdentical(finishParts.finishTimePart, startTimePart)) {
                finishTimePart = finishParts.finishTimePart;
            }
        }
        if (!finishDatePart) {
            //finishDatePart = startDatePart;
        }

        const { lastParts } = this.state;
        if (lastParts) {
            // Try to match up the date part actively being edited.
            if (DP.areDatePartsIdentical(startDatePart, lastParts.finishDatePart)
                || DP.areDatePartsIdentical(finishDatePart, lastParts.startDatePart)) {
                [ startDatePart, finishDatePart ] = [finishDatePart, startDatePart ];
            }

            // Try to match up the time part actively being edited.
            if (TP.areTimePartsIdentical(startTimePart, lastParts.finishTimePart)
                || TP.areTimePartsIdentical(finishTimePart, lastParts.startTimePart)) {
                [ startTimePart, finishTimePart ] = [finishTimePart, startTimePart ];
            }
        }

        Object.assign(stateUpdates, {
            startDatePart: startDatePart,
            startTimePart: startTimePart,
            finishDatePart: finishDatePart,
            finishTimePart: finishTimePart,
        });
    }


    handlePartsChange(newDateParts) {
        const newParts = Object.assign({}, this.state, newDateParts);
        const { startDatePart, finishDatePart, startTimePart, finishTimePart } = newParts;

        const newWhen = {
            daysDuration: undefined,
            startTimePart: undefined,
            millisecondsDuration: undefined,
        };

        if (finishDatePart) {
            const daysDuration = DP.deltaDays(startDatePart, finishDatePart);
            if (daysDuration < 0) {
                newWhen.startDatePart = finishDatePart;
                newWhen.daysDuration = -daysDuration + 1;
            }
            else if (daysDuration > 0) {
                newWhen.startDatePart = startDatePart;
                newWhen.daysDuration = daysDuration + 1;
            }
        }
        else {
            newWhen.startDatePart = startDatePart;
        }

        if (startTimePart) {
            if (finishTimePart) {
                const millisecondsDuration = TP.timePartTo_ms(finishTimePart) - TP.timePartTo_ms(startTimePart);
                if (millisecondsDuration < 0) {
                    newWhen.startTimePart = finishTimePart;
                    newWhen.millisecondsDuration = -millisecondsDuration;
                }
                else {
                    newWhen.startTimePart = startTimePart;
                    newWhen.millisecondsDuration = millisecondsDuration;
                }
            }
            else {
                newWhen.startTimePart = startTimePart;
            }
        }

        this.setState({
            lastParts: newParts,
        });

        const { onChange } = this.props;
        if (onChange) {
            onChange(newWhen);
        }
    }

    onStartDateChange(newDatePart) {
        this.handlePartsChange({
            startDatePart: newDatePart,
        });
    }

    onFinishDateChange(newDatePart) {
        this.handlePartsChange({
            finishDatePart: newDatePart,
        });
    }

    onStartTimeChange(newTimePart) {
        this.handlePartsChange({
            startTimePart: newTimePart,
        });
    }

    onFinishTimeChange(newTimePart) {
        this.handlePartsChange({
            finishTimePart: newTimePart,
        });
    }


    getFocusableElements() {
        const elements = [];
        if (this.startDateRef && this.startDateRef.current) {
            elements.push(this.startDateRef.current);
        }
        if (this.finishDateRef && this.finishDateRef.current) {
            elements.push(this.finishDateRef.current);
        }
        if (this.startTimeRef && this.startTimeRef.current) {
            elements.push(this.startTimeRef.current);
        }
        if (this.finishTimeRef && this.finishTimeRef.current
         && this.state.startTimePart) {
            elements.push(this.finishTimeRef.current);
        }
        return elements;
    }

    getNextFocusElement(dir) {
        const elements = this.getFocusableElements();

        // Find the current focus...
        let focusIndex = elements.indexOf(document.activeElement);
        if (focusIndex >= 0) {
            focusIndex += dir;
            return elements[focusIndex];
        }
    }

    changeFocus(dir) {
        const nextFocus = this.getNextFocusElement(dir);
        return setFocus(nextFocus);
    }

    focusCell(dir) {
        const elements = this.getFocusableElements();
        const toFocus = (dir < 0) ? elements[elements.length - 1] : elements[0];
        setFocus(toFocus);
    }

    contains(element) {
        if (this.containerRef.current) {
            return this.containerRef.current.contains(element);
        }
    }

    onKeyDown(e) {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Previous focus
                if (this.changeFocus(-1)) {
                    e.stopPropagation();
                }
            }
            else {
                // Next focus.
                if (this.changeFocus(1)) {
                    e.stopPropagation();
                }
            }
        }
    }


    renderDateEditor({ datePart, id, ariaLabel, style, onChange, placeholder, disabled, ref }) {
        const { inputClassExtras, allClassExtras, readOnly, datePartFormatter } = this.props;
        let className = 'WhenEditor-partEditor datePartEditor ';
        if (style) {
            className += ' ' + style;
        }
        if (inputClassExtras) {
            className += ' ' + inputClassExtras;
        }
        if (allClassExtras) {
            className += ' ' + allClassExtras;
        }

        if (readOnly || disabled) {
            className += ' readOnly';
        }
        
        return <DatePartEditor
            id = {id}
            ariaLabel = {ariaLabel}
            value = {datePart}
            inputClassExtras = {className}
            onChange = {onChange}
            disabled = {readOnly || disabled}
            datePartFormatter = {datePartFormatter}
            placeholder = {placeholder}
            innerRef = {ref}
        />;
    }


    renderTimeEditor({ timePart, id, ariaLabel, style, onChange, allDayText, placeholder, disabled, ref }) {
        const { inputClassExtras, allClassExtras, readOnly, timePartFormatter } = this.props;
        let className = 'WhenEditor-partEditor timePartEditor ';
        if (style) {
            className += ' ' + style;
        }
        if (inputClassExtras) {
            className += ' ' + inputClassExtras;
        }
        if (allClassExtras) {
            className += ' ' + allClassExtras;
        }

        if (readOnly || disabled) {
            className += ' readOnly';
        }
        disabled = disabled || this.props.disabled;
        
        return <TimePartEditor
            id = {id}
            ariaLabel = {ariaLabel}
            value = {timePart}
            inputClassExtras = {className}
            onChange = {onChange}
            disabled = {readOnly || disabled}
            timePartFormatter = {timePartFormatter}
            allDayText = {allDayText}
            placeholder = {placeholder}
            innerRef = {ref}
        />;
    }


    render() {
        const { id, errorMsg, size, allClassExtras,
            //readOnly, disabled,
        } = this.props;

        let { ariaLabel } = this.props;
        if (!ariaLabel) {
            ariaLabel = '';
        }
        else {
            ariaLabel += ' ';
        }

        let editorsClassName = 'WhenEditor-partsContainer ';
        let divClassName = 'WhenEditor Input-group Mb-0 ';
        if (allClassExtras) {
            editorsClassName += allClassExtras;
            divClassName += allClassExtras;
        }

        const { startDatePart, finishDatePart, 
            startTimePart, finishTimePart } = this.state;

        const startDateComponent = this.renderDateEditor({
            datePart: startDatePart,
            ariaLabel: ariaLabel + 'Start Date',
            syle: 'startDatePartEditor ',
            onChange: this.onStartDateChange,
            ref: this.startDateRef,
        });
        const finishDateComponent = this.renderDateEditor({
            datePart: finishDatePart,
            ariaLabel: ariaLabel + 'Finish Date',
            syle: 'finishDatePartEditor ',
            onChange: this.onFinishDateChange,
            placeholder: startDatePart,
            ref: this.finishDateRef,
        });

        const allDayText = userMsg('WhenEditor-allDay');
        const startTimeComponent = this.renderTimeEditor({
            timePart: startTimePart,
            ariaLabel: ariaLabel + 'Start Time',
            syle: 'startTimePartEditor ',
            onChange: this.onStartTimeChange,
            allDayText: allDayText,
            placeholder: allDayText,    // If the placeholder's displayed then startTimePart is undefined
            ref: this.startTimeRef,
        });
        let finishTimeComponent = this.renderTimeEditor({
            timePart: finishTimePart,
            ariaLabel: ariaLabel + 'Finish Time',
            syle: 'finishTimePartEditor ',
            onChange: this.onFinishTimeChange,
            placeholder: startTimePart,
            disabled: !startTimePart,
            ref: this.finishTimeRef,
        });


        const editorsComponent = <div className = {editorsClassName}>
            <div className = "part">{startDateComponent}</div>
            <div className = "part">{finishDateComponent}</div>
            <div className = "part">{startTimeComponent}</div>
            <div className = "part">{finishTimeComponent}</div>
        </div>;


        let errorMsgComponent;
        if (errorMsg) {
            errorMsgComponent = <div className="Invalid-feedback">
                {errorMsg}
            </div>;
        }

        return <div className = {divClassName} 
            id = {id} 
            size = {size}
            onKeyDown = {this.onKeyDown}
            ref = {this.containerRef}
        >
            {editorsComponent}
            {errorMsgComponent}
        </div>;
    }
}

WhenEditor.propTypes = {
    id: PropTypes.string,
    ariaLabel: PropTypes.string,
    value: PropTypes.object,
    allClassExtras: PropTypes.string,
    inputClassExtras: PropTypes.string,
    size: PropTypes.number,
    errorMsg: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    readOnly: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    datePartFormatter: PropTypes.object,
    timePartFormatter: PropTypes.object,
};
