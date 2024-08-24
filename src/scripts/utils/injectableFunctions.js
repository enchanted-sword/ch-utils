/**
 * fetches react properties from dom elements
 * @param {string} prop - name of property 
 * @param {Element} elem - element with property
 * @returns react property
 */
export async function getReactProp (prop, elem) {
  const fiberKey = Object.keys(elem).find(key => key.startsWith('__reactFiber'));
  if (typeof fiberKey === 'undefined') return null;
  let fiber = elem[fiberKey];

  while (fiber !== null) {
    if (prop in fiber.memoizedProps) return fiber.memoizedProps[prop];
    else  fiber = fiber.return;
  }
}