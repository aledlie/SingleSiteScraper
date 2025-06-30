import { cleanText } from '../utils/validators.ts';
import { ScrapedData } from '../types/index.ts';
import { HTMLElement } from 'node-html-parser';

export function getMetadata(root: HTMLElement): Record<string, string> {
  const metaTags: Record<string, string> = {};
  metaTags['h2'] = extractH2Titles(root);

  root.querySelectorAll('meta').forEach(meta => {
    const name = meta.getAttribute('name');
    const property = meta.getAttribute('property');
    const content = meta.getAttribute('content');

    if (content) {
      if (name) {
        metaTags[name] = content;
      } else if (property) {
        metaTags[property] = content;
      }
    }
  });


  return metaTags;
}

function extractH2Titles(root: HTMLElement): string {
  return root
    .querySelectorAll('h2')
    .map(el => el.innerText.trim())
    .filter(Boolean)
    .join(', ');
}

export const getDescription = (
  root: HTMLElement
): ScrapedData['description'] => {
  return root.querySelector('meta[name="description"]')
    ?.getAttribute('content') || '';
}

export const getTitle = (
  root: HTMLElement
): ScrapedData['title'] => {
  return root.querySelector('title')
    ?.textContent || '';
}

export const getLinks = (
  root: HTMLElement,
  maxLinks: number
): ScrapedData['links'] => {
  const links = root.querySelectorAll('a').map((el) => ({
    text: cleanText(el.textContent),
    url: el.getAttribute('href') || '',
  }));
  return maxLinks ? links.slice(0, maxLinks) : links;
};

export const getText = (
  root: HTMLElement,
  maxText: number
): ScrapedData['text'] => {
  return root.querySelectorAll('p')
    .map((el) => cleanText(el.textContent))
      .slice(0, maxText);
};

export const getImages = (
  root: HTMLElement,
  maxImages: number
): ScrapedData['images'] => {
  return root.querySelectorAll('img')
    .map((el) => ({
      src: el.getAttribute('src') || '',
      alt: el.getAttribute('alt') || '',
    }))
    .slice(0, maxImages);
};



