export async function getReactProp (prop, elem) {
  const fiberKey = Object.keys(elem).find(key => key.startsWith('__reactFiber'));
  let fiber = elem[fiberKey];

  while (fiber !== null) {
    if (prop in fiber.memoizedProps) return fiber.memoizedProps[prop];
    else  fiber = fiber.return;
  }
}