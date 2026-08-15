import { SITE } from './config.js';

type AccountDeletionAction =
  | 'confirm'
  | 'recover';

type ActionResponse = {
  ok?: boolean;
  state?: string;
  title?: string;
  message?: string;
  deepLink?: string | null;
  error?: {
    code?: string;
    message?: string;
  };
};

const title =
  document.querySelector<HTMLElement>(
    '[data-action-title]',
  );

const copy =
  document.querySelector<HTMLElement>(
    '[data-action-copy]',
  );

const warning =
  document.querySelector<HTMLElement>(
    '[data-action-warning]',
  );

const submit =
  document.querySelector<HTMLButtonElement>(
    '[data-action-submit]',
  );

const appLink =
  document.querySelector<HTMLAnchorElement>(
    '[data-action-app]',
  );

const fragment = new URLSearchParams(
  window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash,
);

const rawAction = fragment.get('action');
const token = fragment.get('token');

const action: AccountDeletionAction | null =
  rawAction === 'confirm' || rawAction === 'recover'
    ? rawAction
    : null;

const validToken =
  typeof token === 'string' &&
  token.length >= 40 &&
  token.length <= 200;

if (!action || !validToken) {
  showInvalid();
} else {
  showReady(action);

  submit?.addEventListener(
    'click',
    () => {
      void submitAction(action, token);
    },
  );
}

function showReady(
  action: AccountDeletionAction,
): void {
  if (!title || !copy || !submit) {
    return;
  }

  if (action === 'confirm') {
    title.textContent =
      'Confirm account deletion';

    copy.textContent =
      'Confirming starts your 3-day recovery period. Your account and data remain recoverable during that window.';

    if (warning) {
      warning.hidden = false;
      warning.textContent =
        'After the recovery period ends, your Chowseek account and associated data will be permanently deleted.';
    }

    submit.textContent =
      'Confirm account deletion';
  } else {
    title.textContent =
      'Recover your Chowseek account';

    copy.textContent =
      'Recovering your account cancels the pending permanent deletion request.';

    if (warning) {
      warning.hidden = false;
      warning.textContent =
        'Recovery must be claimed before the 3-day recovery window ends.';
    }

    submit.textContent =
      'Recover my account';
  }

  submit.hidden = false;
}

async function submitAction(
  action: AccountDeletionAction,
  token: string,
): Promise<void> {
  if (!submit) return;

  submit.disabled = true;

  const originalLabel =
    submit.textContent ?? 'Continue';

  submit.textContent =
    'Working…';

  try {
    const response = await fetch(
      SITE.accountDeletionEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          action,
          token,
        }),
      },
    );

    const payload =
      await parseResponse(response);

    if (!response.ok || !payload.ok) {
      showFailure(
        payload.error?.message ??
          'Chowseek could not complete this request. Please try again.',
      );

      submit.disabled = false;
      submit.textContent = originalLabel;
      return;
    }

    // Remove the sensitive token from the visible URL once the action has
    // completed. It remains in the fragment until the explicit POST succeeds.
    history.replaceState(
      null,
      '',
      '/account-deletion/',
    );

    if (title) {
      title.textContent =
        payload.title ??
        (action === 'confirm'
          ? 'Deletion confirmed'
          : 'Account recovered');
    }

    if (copy) {
      copy.textContent =
        payload.message ??
        'Your account request was completed.';
    }

    if (warning) {
      warning.hidden = true;
      warning.textContent = '';
    }

    submit.hidden = true;

    if (
      appLink &&
      typeof payload.deepLink === 'string' &&
      payload.deepLink.startsWith('chowseek://')
    ) {
      appLink.href = payload.deepLink;
      appLink.hidden = false;
    }
  } catch (_) {
    showFailure(
      'Chowseek could not confirm the result of this request. ' +
        'It may still have completed successfully.',
    );

    submit.disabled = false;
    submit.textContent = originalLabel;
  }
}

async function parseResponse(
  response: Response,
): Promise<ActionResponse> {
  try {
    return await response.json() as ActionResponse;
  } catch (_) {
    return {
      ok: false,
      error: {
        message:
          'The account service returned an invalid response.',
      },
    };
  }
}

function showInvalid(): void {
  if (title) {
    title.textContent =
      'Invalid account link';
  }

  if (copy) {
    copy.textContent =
      'This account deletion link is incomplete, invalid, expired, or has already been used.';
  }

  if (warning) {
    warning.hidden = true;
  }

  if (submit) {
    submit.hidden = true;
  }
}

function showFailure(
  message: string,
): void {
  if (copy) {
    copy.textContent = message;
  }

  if (warning) {
    warning.hidden = false;
    warning.textContent =
      'We could not confirm the final account status. ' +
      'Your request may still have completed. ' +
      'Open Chowseek to check your current account status ' +
      'before retrying this link.';
  }
}
