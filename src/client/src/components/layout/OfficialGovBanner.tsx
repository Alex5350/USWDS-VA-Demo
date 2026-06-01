"use client";

import { useId, useState } from "react";

export function OfficialGovBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <section className="official-banner" aria-label="Official government website">
      <div className="official-banner__header">
        <div className="official-banner__inner">
          <span className="official-banner__flag" aria-hidden="true" />
          <span className="official-banner__text">An official website of the United States government</span>
          <button
            aria-controls={contentId}
            aria-expanded={isOpen}
            className="official-banner__button"
            type="button"
            onClick={() => setIsOpen((current) => !current)}
          >
            Here&apos;s how you know
          </button>
        </div>
      </div>
      <div className="official-banner__content" hidden={!isOpen} id={contentId}>
        <div className="official-banner__inner official-banner__guidance-grid">
          <div className="official-banner__guidance">
            <GovBuildingIcon />
            <div>
              <p className="official-banner__guidance-heading">The .gov means it&apos;s official.</p>
              <p>
                Federal government websites often end in .gov or .mil. Before sharing sensitive information, make sure
                you&apos;re on a federal government site.
              </p>
            </div>
          </div>
          <div className="official-banner__guidance">
            <LockIcon />
            <div>
              <p className="official-banner__guidance-heading">The site is secure.</p>
              <p>
                The <strong>https://</strong> ensures that you&apos;re connecting to the official website and that any
                information you provide is encrypted and sent securely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GovBuildingIcon() {
  return (
    <svg className="official-banner__icon official-banner__icon--gov" aria-hidden="true" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        fill="currentColor"
        d="M18 44h28v4H18v-4Zm4-4h4V27h-4v13Zm8 0h4V27h-4v13Zm8 0h4V27h-4v13ZM17 24l15-8 15 8v3H17v-3Z"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="official-banner__icon official-banner__icon--lock" aria-hidden="true" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        fill="currentColor"
        d="M22 30h3v-5a7 7 0 0 1 14 0v5h3c1.1 0 2 .9 2 2v15c0 1.1-.9 2-2 2H22c-1.1 0-2-.9-2-2V32c0-1.1.9-2 2-2Zm7 0h6v-5a3 3 0 0 0-6 0v5Z"
      />
    </svg>
  );
}
