export const text = (value) => document.createTextNode(String(value ?? ''));

export function node(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') element.className = value;
    else if (key === 'textContent') element.textContent = value;
    else element.setAttribute(key, value);
  });
  children.forEach((child) => element.append(child));
  return element;
}
