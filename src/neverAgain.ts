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
    public static tooltipElem: HTMLElement;
    public static elemIdCount = 0;

    constructor() {
        this._markInstance = new Mark(NeverAgain.docBody);
        this._createTooltipElem();
    }

    private _createTooltipElem(): void {
        // Add tooltip element
        NeverAgain.tooltipElem = document.createElement('div');
        NeverAgain.tooltipElem.appendChild(document.createTextNode("Title"));
        NeverAgain.tooltipElem.classList.add('na-tooltip');
        document.body.appendChild(NeverAgain.tooltipElem);
        const link: HTMLElement = document.createElement('a');
        link.setAttribute('href','https://www.boycotzionism.com/');
        link.innerText = "Description";
        link.classList.add('a-block');
        NeverAgain.tooltipElem.appendChild(link);

        // Add arrow to tooltip element
        const tooltipArrowElem: HTMLElement = document.createElement('div');
        tooltipArrowElem.id = 'na-arrow';
        tooltipArrowElem.setAttribute('data-popper-arrow', '');
        NeverAgain.tooltipElem.appendChild(tooltipArrowElem);

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
        NeverAgain.markedElements.map(mElem => {
            mElem.elem.addEventListener('mouseenter', () => {
                NeverAgain.create(mElem);
            });
            const tooltipFocus = () => NeverAgain.tooltipInFocus = true;
            NeverAgain.tooltipElem.addEventListener('mouseenter', tooltipFocus);
            NeverAgain.tooltipElem.addEventListener('focus', tooltipFocus);


            const destroy = () => NeverAgain.destroy(mElem);
            mElem.elem.addEventListener('mouseleave', destroy);
            mElem.elem.addEventListener('blur', destroy);

            const ttDestroy = () => NeverAgain.destroy(<string>tooltipElem.getAttribute('data-na-referrer'), tooltipElem, true);
            NeverAgain.tooltipElem.addEventListener('mouseleave', ttDestroy);
            NeverAgain.tooltipElem.addEventListener('blur', ttDestroy);
        });
    };

    public static create(elem: MarkElement) {
        NeverAgain.tooltipElem.setAttribute('data-na-show', 'true');
        elem.popperRef = createPopper(elem.elem, NeverAgain.tooltipElem, {
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

    public static destroy(elem: MarkElement) {
        /* setTimeout(() => {
            if (!NeverAgain.tooltipInFocus && elem.popperRef) {
                NeverAgain.destroyCore(elem);
            }
        }, 500); */
        NeverAgain.destroyCore(elem);
    }

    public static destroyCore(elem: MarkElement) {
        NeverAgain.tooltipInFocus = false;
        NeverAgain.tooltipElem.removeAttribute('data-na-show');
        elem.popperRef.destroy();
        elem.popperRef = null;
    } 
}

const neverAgain = new NeverAgain();
neverAgain.markAll();
