import { createPopper } from '@popperjs/core';
import Mark from 'mark.js';
import * as namedData from './named_data.json';
import * as names from './names.json';

interface MarkElement {
  elem: HTMLElement;
  popperRef: any;
}

interface NeverAgainListItem {
  [key: string]: {
    data: {
      reason: string;
      proof: string;
    };
  };
}

class NeverAgain {
  private _markInstance: Mark;
  private _listNames: string[] = names;

  public static data: NeverAgainListItem = namedData;
  public static docBody = document.getElementsByTagName('body')[0];
  public static dataAttrName = 'data-namark';
  public static markedElementsMap: WeakMap<HTMLElement, any> = new WeakMap();
  public static markedElementInFocus: null | MarkElement = null;
  public static tooltipElem: HTMLElement;

  constructor() {
    this._markInstance = new Mark(NeverAgain.docBody);
    this._createTooltipElem();
  }

  private _createTooltipElem(): void {
    // Add tooltip element
    NeverAgain.tooltipElem = document.createElement('div');
    NeverAgain.tooltipElem.appendChild(
      document.createTextNode('Boycott Zionism')
    );
    NeverAgain.tooltipElem.classList.add('na-tooltip');
    document.body.appendChild(NeverAgain.tooltipElem);
    const link: HTMLElement = document.createElement('a');
    link.setAttribute('href', 'https://www.boycotzionism.com/');
    link.innerText = 'Boycott Zionism';
    link.classList.add('a-block');
    NeverAgain.tooltipElem.appendChild(link);

    // Add arrow to tooltip element
    const tooltipArrowElem: HTMLElement = document.createElement('div');
    tooltipArrowElem.id = 'na-arrow';
    tooltipArrowElem.setAttribute('data-popper-arrow', '');
    NeverAgain.tooltipElem.appendChild(tooltipArrowElem);
  }

  public markAll(): void {
    const config: Mark.MarkOptions = {
      className: 'na-highlight',
      separateWordSearch: false,
      accuracy: 'exactly',
      diacritics: false,
      caseSensitive: true,
      each: NeverAgain.eachMark,
      done: () => {}
    };
    
    // Process names in smaller chunks to avoid regex stack overflow in Chrome
    const chunkSize = 50;
    let processedCount = 0;
    
    const processNextChunk = () => {
      const chunk = this._listNames.slice(processedCount, processedCount + chunkSize);
      if (chunk.length === 0) {
        // All chunks processed, call afterMark
        NeverAgain.afterMark();
        return;
      }
      
      this._markInstance.mark(chunk, {
        ...config,
        done: () => {
          processedCount += chunk.length;
          // Use setTimeout to avoid deep call stack
          setTimeout(processNextChunk, 0);
        }
      });
    };
    
    // Start processing chunks
    processNextChunk();
  }

  public static updateTooltipLink(name: string | null) {
    if (!name) return;

    const link = NeverAgain.data[name].data.proof;
    const linkText = NeverAgain.data[name].data.reason;
    NeverAgain.tooltipElem.querySelector('a')!.setAttribute('href', link);
    NeverAgain.tooltipElem.querySelector('a')!.textContent = linkText;
  }

  public static eachMark(elem: HTMLElement): void {
    NeverAgain.markedElementsMap.set(elem, { popperRef: null });
  }

  public static afterMark(): void {
    document.querySelectorAll('.na-highlight').forEach((element) => {
      const elem = element as HTMLElement;
      elem.addEventListener('mouseenter', () => {
        const data = NeverAgain.markedElementsMap.get(elem);
        if (data) {
          NeverAgain.create({ elem, popperRef: data.popperRef });
          NeverAgain.markedElementInFocus = { elem, popperRef: data.popperRef };
          
          const destroy = () => NeverAgain.destroy({ elem, popperRef: data.popperRef });
          elem.addEventListener('mouseleave', destroy);
          elem.addEventListener('blur', destroy);
          
          const mouseEnterListener = () => {
            NeverAgain.markedElementInFocus = { elem, popperRef: data.popperRef };
            NeverAgain.tooltipElem.removeEventListener('mouseleave', mouseEnterListener);
          };
          
          NeverAgain.tooltipElem.addEventListener('mouseenter', mouseEnterListener);
          NeverAgain.tooltipElem.addEventListener('focus', mouseEnterListener);
        }
      });
    });

    const ttDestroy = () => {
      if (NeverAgain.markedElementInFocus) {
        NeverAgain.destroy(NeverAgain.markedElementInFocus, true);
      }
    };
    NeverAgain.tooltipElem.addEventListener('mouseleave', ttDestroy);
    NeverAgain.tooltipElem.addEventListener('blur', ttDestroy);
  }

  public static create(elem: MarkElement) {
    NeverAgain.tooltipElem.setAttribute('data-na-show', 'true');
    const name = elem.elem.textContent;
    NeverAgain.updateTooltipLink(name);

    const popperRef = createPopper(elem.elem, NeverAgain.tooltipElem, {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ],
    });
    
    NeverAgain.markedElementsMap.set(elem.elem, { popperRef });
    elem.popperRef = popperRef;
  }

  public static destroy(
    elem: MarkElement | null,
    fromTooltip: boolean = false
  ) {
    if (!elem) {
      return;
    }

    NeverAgain.markedElementInFocus = null;

    if (fromTooltip) {
      NeverAgain.destroyCore(elem);
    } else {
      setTimeout(() => {
        if (!NeverAgain.markedElementInFocus) {
          NeverAgain.destroyCore(elem);
        }
      }, 500);
    }
  }

  public static destroyCore(elem: MarkElement) {
    NeverAgain.tooltipElem.removeAttribute('data-na-show');
    if (elem.popperRef) {
      elem.popperRef.destroy();
      elem.popperRef = null;
      
      const data = NeverAgain.markedElementsMap.get(elem.elem);
      if (data) {
        data.popperRef = null;
        NeverAgain.markedElementsMap.set(elem.elem, data);
      }
    }
  }
}

// Defer execution until the page has fully loaded
window.addEventListener('load', () => {
  console.log('NeverAgain: Page loaded, starting marking process');
  const neverAgain = new NeverAgain();
  neverAgain.markAll();
});
