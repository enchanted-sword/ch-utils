const responseEvent = 'ch-utils-injection-response';
const requestEvent = 'ch-utils-injection-request';

const initInjection = () => import('../scripts/utils/injectableFunctions.js').then(injectableFunctions =>
  document.documentElement.addEventListener(requestEvent, async event => {
    const { detail, target } = event;
    const { id, name, args } = JSON.parse(detail);

    const fallback = () =>
      new Error(`invalid function '${name}'`);
    const func = injectableFunctions[name] ?? fallback;

    try {
      const result = await func(...args, target);
      target.dispatchEvent(
        new CustomEvent(responseEvent, { detail: JSON.stringify({ id, result }) }),
      );
    } catch (exception) {
      target.dispatchEvent(
        new CustomEvent(responseEvent, {
          detail: JSON.stringify({
            id,
            exception: {
              message: exception.message,
              name: exception.name,
              stack: exception.stack,
              ...exception,
            },
          }),
        }),
      );
    }
  }),
);

initInjection();