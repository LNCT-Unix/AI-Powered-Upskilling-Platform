export default function OctoMascotAnimation({ className = '' }) {
  return (
    <div className={`octo-scene-container relative w-full max-w-[560px] mx-auto ${className}`}>
      <style>{`
        @keyframes octo-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes octo-shrink {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(0.82); opacity: 0.7; }
        }
        @keyframes octo-blink {
          0%, 93.5%, 97.5%, 100% { transform: scaleY(1); }
          95.5% { transform: scaleY(0.08); }
        }
        @keyframes octo-sparkle {
          0%, 100% { opacity: 0.25; transform: scale(0.75) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.12) rotate(8deg); }
        }
        @keyframes octo-rise {
          0% { transform: translateY(0); opacity: 0; }
          18% { opacity: 0.6; }
          100% { transform: translateY(-95px); opacity: 0; }
        }
        @keyframes octo-floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-11px); }
        }
        @keyframes octo-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes octo-bookbob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-9px) rotate(1.6deg); }
        }

        .octo-scene {
          position: relative;
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
          isolation: isolate;
        }
        .octo-halo {
          position: absolute;
          inset: 6%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 42%, rgba(124, 92, 250, 0.18), rgba(255, 201, 60, 0.14) 55%, transparent 74%);
        }
        .octo-ring {
          position: absolute;
          inset: 0;
          border: 2px dashed rgba(124, 92, 250, 0.28);
          border-radius: 50%;
          animation: octo-spin 55s linear infinite;
        }
        .octo-bob-elem {
          position: relative;
          z-index: 2;
          animation: octo-bob 7s ease-in-out infinite;
        }
        .octo-svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
        }
        .octo-shadow {
          position: absolute;
          left: 50%;
          bottom: 1.5%;
          width: 58%;
          height: 30px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(61, 44, 134, 0.30), transparent 66%);
          animation: octo-shrink 7s ease-in-out infinite;
          z-index: 1;
        }
        .octo-eye {
          animation: octo-blink 4.8s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .octo-eye.e2 {
          animation-delay: 0.06s;
        }
        .octo-spark {
          animation: octo-sparkle 2.6s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .octo-spark.s2 { animation-delay: 0.45s; }
        .octo-spark.s3 { animation-delay: 0.9s; }

        .octo-bub {
          animation: octo-rise 6.5s linear infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .octo-bub.b2 { animation-delay: 2.1s; }
        .octo-bub.b3 { animation-delay: 4.2s; }

        .octo-bookg {
          animation: octo-bookbob 5.4s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .octo-tile {
          position: absolute;
          z-index: 3;
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          color: #fff;
          box-shadow: 0 18px 36px -14px rgba(61, 44, 134, 0.5);
          animation: octo-floaty 6s ease-in-out infinite;
          animation-delay: var(--fd, 0s);
        }
        .octo-t-code {
          top: 5%;
          left: 2%;
          background: linear-gradient(135deg, #B49CFB, #8F74F2);
        }
        .octo-t-chart {
          top: 41%;
          right: -1.5%;
          background: linear-gradient(135deg, #FFAE63, #F97B3D);
        }
        .octo-t-cap {
          bottom: 3.5%;
          left: 9%;
          background: linear-gradient(135deg, #8F74F2, #6C4BEF);
        }
        .octo-chip {
          position: absolute;
          z-index: 3;
          display: flex;
          align-items: center;
          gap: 11px;
          background: #fff;
          border: 1px solid #E8E0CC;
          border-radius: 16px;
          padding: 11px 15px;
          box-shadow: 0 20px 44px -18px rgba(61, 44, 134, 0.38);
          animation: octo-floaty 5.4s ease-in-out infinite;
          animation-delay: var(--fd, 0s);
        }
        .octo-chip b {
          display: block;
          font-size: 0.83rem;
          line-height: 1.25;
          font-weight: 700;
          color: #2F2A3E;
        }
        .octo-chip small {
          display: block;
          color: #6E6880;
          font-size: 0.72rem;
          line-height: 1.3;
        }
        .octo-chip-ic {
          width: 32px;
          height: 32px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #E7F8EF;
          flex: none;
        }
        .octo-chip-ic.ic-p {
          background: #EFEAFC;
        }
        .octo-c-test {
          bottom: 2.5%;
          right: -2%;
        }
        .octo-c-road {
          top: 3%;
          right: 15%;
        }

        @media (max-width: 640px) {
          .octo-tile, .octo-chip { transform: scale(0.9); }
          .octo-t-cap, .octo-c-road { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="octo-scene">
        <div className="octo-halo" />
        <div className="octo-ring" />
        <div className="octo-shadow" />
        <div className="octo-bob-elem">
          <svg
            className="octo-svg"
            viewBox="0 0 560 560"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="octoByte mascot: a friendly purple octopus reading a yellow book"
          >
            <defs>
              <linearGradient id="bodyGrad" x1="280" y1="108" x2="280" y2="372" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#BCA7FB" />
                <stop offset="1" stopColor="#8F74F2" />
              </linearGradient>
            </defs>

            {/* Sparkles */}
            <path className="octo-spark s1" d="M336 54 L330 26" stroke="#FF9838" strokeWidth="7" strokeLinecap="round" />
            <path className="octo-spark s2" d="M366 62 L382 40" stroke="#FFAE63" strokeWidth="6" strokeLinecap="round" />
            <path className="octo-spark s3" d="M388 92 L414 84" stroke="#FFAE63" strokeWidth="6" strokeLinecap="round" />

            {/* Bubbles */}
            <circle className="octo-bub b1" cx="138" cy="436" r="5" fill="#BCA9F8" />
            <circle className="octo-bub b2" cx="444" cy="396" r="7" fill="#BCA9F8" />
            <circle className="octo-bub b3" cx="414" cy="482" r="4" fill="#D3C6FB" />

            {/* Back tentacles with SVG morph animation */}
            <g stroke="#9077F2" strokeWidth="17" strokeLinecap="round" fill="none">
              <path d="M180 352 C164 380 176 408 158 434 C148 450 160 464 150 478">
                <animate
                  attributeName="d"
                  dur="4.4s"
                  begin="-0.3s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values="M180 352 C164 380 176 408 158 434 C148 450 160 464 150 478; M180 352 C172 382 190 406 170 432 C158 450 172 462 164 476; M180 352 C164 380 176 408 158 434 C148 450 160 464 150 478"
                />
              </path>
              <path d="M214 360 C206 390 226 412 212 440 C204 458 218 468 212 482">
                <animate
                  attributeName="d"
                  dur="3.6s"
                  begin="-1.2s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values="M214 360 C206 390 226 412 212 440 C204 458 218 468 212 482; M214 360 C222 390 202 412 218 440 C228 458 210 468 218 482; M214 360 C206 390 226 412 212 440 C204 458 218 468 212 482"
                />
              </path>
              <path d="M262 364 C258 380 268 388 262 400">
                <animate
                  attributeName="d"
                  dur="2.9s"
                  begin="-0.5s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values="M262 364 C258 380 268 388 262 400; M262 364 C266 380 256 388 264 400; M262 364 C258 380 268 388 262 400"
                />
              </path>
              <path d="M298 364 C302 380 292 388 298 400">
                <animate
                  attributeName="d"
                  dur="3.2s"
                  begin="-1.6s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values="M298 364 C302 380 292 388 298 400; M298 364 C294 380 304 388 296 400; M298 364 C302 380 292 388 298 400"
                />
              </path>
              <path d="M366 360 C374 390 354 412 368 440 C376 458 362 468 368 482">
                <animate
                  attributeName="d"
                  dur="3.8s"
                  begin="-2s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values="M366 360 C374 390 354 412 368 440 C376 458 362 468 368 482; M366 360 C358 390 378 412 362 440 C352 458 370 468 362 482; M366 360 C374 390 354 412 368 440 C376 458 362 468 368 482"
                />
              </path>
              <path d="M400 352 C416 380 404 408 422 434 C432 450 420 464 430 478">
                <animate
                  attributeName="d"
                  dur="4.1s"
                  begin="-0.9s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values="M400 352 C416 380 404 408 422 434 C432 450 420 464 430 478; M400 352 C408 382 390 406 410 432 C422 450 408 462 416 476; M400 352 C416 380 404 408 422 434 C432 450 420 464 430 478"
                />
              </path>
            </g>

            {/* Body */}
            <path
              d="M150 306 C150 178 204 108 280 108 C356 108 410 178 410 306 C410 352 372 372 280 372 C188 372 150 352 150 306 Z"
              fill="url(#bodyGrad)"
            />
            <ellipse cx="280" cy="346" rx="94" ry="24" fill="#CDBBFF" opacity="0.5" />

            {/* Face */}
            <g className="octo-eye">
              <ellipse cx="232" cy="224" rx="12.5" ry="14.5" fill="#2F2A3E" />
              <circle cx="236.5" cy="218.5" r="4" fill="#fff" opacity="0.92" />
            </g>
            <g className="octo-eye e2">
              <ellipse cx="328" cy="224" rx="12.5" ry="14.5" fill="#2F2A3E" />
              <circle cx="332.5" cy="218.5" r="4" fill="#fff" opacity="0.92" />
            </g>
            <path d="M254 256 Q280 278 306 256" stroke="#2F2A3E" strokeWidth="5.5" strokeLinecap="round" />

            {/* Open book */}
            <g transform="translate(280 428) scale(1.14) translate(-280 -428)">
              <g className="octo-bookg">
                <path d="M280 402 C260 390 236 388 222 396 L222 456 C236 448 260 450 280 462 Z" fill="#FFC93C" />
                <path d="M280 402 C300 390 324 388 338 396 L338 456 C324 448 300 450 280 462 Z" fill="#FFD34D" />
                <path d="M280 406 C263 396 243 394 231 401 L231 448 C243 442 263 444 280 454 Z" fill="#FFF3CF" opacity="0.85" />
                <path d="M280 406 C297 396 317 394 329 401 L329 448 C317 442 297 444 280 454 Z" fill="#FFF9E3" opacity="0.85" />
                <path d="M280 402 L280 462" stroke="#E8A81F" strokeWidth="3" />
                <path d="M314 394 L314 424 L322 417 L330 424 L330 398 Z" fill="#8F74F2" />
              </g>
            </g>

            {/* Gripping tentacles */}
            <g stroke="#7C5CFA" strokeWidth="13" strokeLinecap="round" fill="none">
              <path d="M238 390 C228 404 230 424 242 438">
                <animate
                  attributeName="d"
                  dur="3.4s"
                  begin="-0.6s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values="M238 390 C228 404 230 424 242 438; M238 390 C226 402 226 424 240 440; M238 390 C228 404 230 424 242 438"
                />
              </path>
              <path d="M322 390 C332 404 330 424 318 438">
                <animate
                  attributeName="d"
                  dur="3.1s"
                  begin="-1.8s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  values="M322 390 C332 404 330 424 318 438; M322 390 C334 402 334 424 320 440; M322 390 C332 404 330 424 318 438"
                />
              </path>
            </g>
          </svg>
        </div>

        {/* Floating brand tiles */}
        <div className="octo-tile octo-t-code" style={{ '--fd': '0.2s' }} aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6 4 12l5 6" />
            <path d="M15 6l5 6-5 6" />
          </svg>
        </div>
        <div className="octo-tile octo-t-chart" style={{ '--fd': '1.1s' }} aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
            <path d="M5 20v-8" />
            <path d="M12 20V5" />
            <path d="M19 20v-11" />
          </svg>
        </div>
        <div className="octo-tile octo-t-cap" style={{ '--fd': '0.6s' }} aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4 2 9.5l10 5.5 10-5.5L12 4Z" />
            <path d="M6.5 12v4.4c0 1.5 2.5 2.9 5.5 2.9s5.5-1.4 5.5-2.9V12" />
          </svg>
        </div>

        {/* Floating product chips */}
        <div className="octo-chip octo-c-test" style={{ '--fd': '0.9s' }}>
          <span className="octo-chip-ic">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" fill="#2FBF8F" />
              <path d="M8.4 12.3l2.4 2.4 4.8-5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <b>Diagnostic complete</b>
            <small>Level: Intermediate · 7 questions</small>
          </span>
        </div>
        <div className="octo-chip octo-c-road" style={{ '--fd': '1.5s' }}>
          <span className="octo-chip-ic ic-p">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7C5CFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
              <path d="M9 4v14" />
              <path d="M15 6v14" />
            </svg>
          </span>
          <span>
            <b>Roadmap ready</b>
            <small>12 steps · ~46 hrs</small>
          </span>
        </div>
      </div>
    </div>
  );
}
