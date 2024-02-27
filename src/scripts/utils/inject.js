const responseEvent = 'ch-utils-injection-response';
const requestEvent = 'ch-utils-injection-request';

/**
 * @param {Function} func - injectable function to run in the page context
 * @param {Array} [args] - array of arguments to run the function with
 * @param {Element} [target] - element to append script to; passed as the last argument of the injected function
 * @returns {Promise<any>} The return value of the function or caught exception
 */
export const inject = (name, args = [], target = document.documentElement) =>
  new Promise((resolve, reject) => {
    const requestId = String(Math.random());
    const data = { name, args, id: requestId };

    const responseHandler = ({ detail }) => {
      const { id, result, exception } = JSON.parse(detail);
      if (id !== requestId) return;

      target.removeEventListener(responseEvent, responseHandler);
      exception ? reject(exception) : resolve(result);
    };

    target.addEventListener(responseEvent, responseHandler);
    target.dispatchEvent(new CustomEvent(requestEvent, { detail: JSON.stringify(data), bubbles: true }));
  });