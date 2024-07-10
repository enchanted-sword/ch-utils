
const longPressDelay = 500;

export const onLongPress = (elem, func) => {
  if (elem.dataset.longpressEvent) return;
  let timeoutId;

  elem.dataset.longpressEvent = true;

  elem.addEventListener('touchstart', e => {
    timeoutId = setTimeout(() => {
      timeoutId = null;
      e.stopPropagation();
      func(e);
    }, longPressDelay);
  });
  elem.addEventListener('contextmenu', e => e.preventDefault());
  elem.addEventListener('touchend', () =>  timeoutId && clearTimeout(timeoutId));
  elem.addEventListener('touchmove', () => timeoutId && clearTimeout(timeoutId));
};