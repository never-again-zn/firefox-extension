import Mark from 'mark.js';
import { createPopper } from '@popperjs/core';
import * as listData from './merged_data.json';

interface MarkElement {
    elem: HTMLElement,
    popperRef: any
}

interface NeverAgainListItem {
    name: string;
    reason: string;
    proof: string;
}

class NeverAgain {
    private _markInstance: Mark;
    private _list: NeverAgainListItem[] = listData;
    private _listNames: string[] = this._list.map(item => item.name);

    public static docBody = document.getElementsByTagName('body')[0];
    public static dataAttrName = 'data-namark';
    public static markedElements: MarkElement[] = [];
    public static tooltipInFocus = false;
    public static elemIdCount = 0;

    constructor() {
        this._markInstance = new Mark(NeverAgain.docBody);
        this._createTooltipElem();
    }

    private _createTooltipElem(): void {
        // Add tooltip element
        const tooltipElem: HTMLElement = document.createElement('div');
        tooltipElem.appendChild(document.createTextNode("Title"));
        tooltipElem.classList.add('na-tooltip');
        document.body.appendChild(tooltipElem);
        const link: HTMLElement = document.createElement('a');
        link.setAttribute('href','https://www.boycotzionism.com/');
        link.innerText = "Description";
        link.classList.add('a-block');
        tooltipElem.appendChild(link);

        // Add arrow to tooltip element
        const tooltipArrowElem: HTMLElement = document.createElement('div');
        tooltipArrowElem.id = 'na-arrow';
        tooltipArrowElem.setAttribute('data-popper-arrow', '');
        tooltipElem.appendChild(tooltipArrowElem);

        NeverAgain.tooltipInFocus = false;
    }

    public markAll(): void {
        const config: Mark.MarkOptions = {
            className: 'na-highlight', 
            separateWordSearch: false, 
            accuracy: "exactly", 
            each: NeverAgain.eachMark, 
            done: NeverAgain.afterMark 
        };
        this._markInstance.mark(this._listNames, config);
    }

    public static eachMark(elem: HTMLElement): void {
        elem.setAttribute(NeverAgain.dataAttrName, NeverAgain.elemIdCount + '');
        NeverAgain.markedElements.push({elem: elem, popperRef: null});
        NeverAgain.elemIdCount++;
    };

    public static afterMark(): void {
        const showEvents: string[] = ['mouseenter', 'focusin'];
        const hideEvents: string[] = ['mouseleave', 'blur'];

        showEvents.forEach(showEvent => {
            NeverAgain.docBody.addEventListener(showEvent, (event: Event) => {
                console.log(event);
                // NeverAgain.create(event.target, tooltipElem);
                NeverAgain.tooltipInFocus = true;
            });
        });

        hideEvents.forEach(hideEvent => {
            Object.keys(NeverAgain.markedElements).forEach(mElemId => {
                NeverAgain.docBody.addEventListener(hideEvent, () => {
                    NeverAgain.destroy(mElemId, tooltipElem);
                });
            });

            tooltipElem.addEventListener(hideEvent, () => {
                NeverAgain.destroy(<string>tooltipElem.getAttribute('data-na-referrer'), tooltipElem, true);
            });
        });
    };

    public static create(target: unknown, tooltipElem: HTMLElement) {


        tooltipElem.setAttribute('data-na-show', '');
        tooltipElem.setAttribute('data-na-referrer', elemId);
        NeverAgain.markedElements[elemId].popperRef = createPopper(NeverAgain.markedElements[elemId].elem, tooltipElem, {
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        offset: [0, 8],
                    },
                },
            ],
        });
    }

    public static destroy(elemId: string, tooltipElem: HTMLElement, fromTooltip: boolean = false) {
        if (fromTooltip) {
            NeverAgain.destroyCore(elemId, tooltipElem);
        } else {
            setTimeout(() => {
                if (!NeverAgain.tooltipInFocus && NeverAgain.markedElements[elemId].popperRef) {
                    NeverAgain.destroyCore(elemId, tooltipElem);
                }
            }, 500);
        }
    }

    public static destroyCore(elemId: string, tooltipElem: HTMLElement) {
        NeverAgain.tooltipInFocus = false;
        tooltipElem.removeAttribute('data-na-show');
        tooltipElem.removeAttribute('data-na-referrer');
        NeverAgain.markedElements[elemId].popperRef.destroy();
        NeverAgain.markedElements[elemId].popperRef = null;
    }
}

const neverAgain = new NeverAgain();
neverAgain.markAll();
