export function printElementById(
  elementId: string,
  title: string = "Print Document",
  isLandscape: boolean = false
) {
  const sourceElem = document.getElementById(elementId);
  if (!sourceElem) {
    window.print();
    return;
  }

  // Create temporary hidden iframe for clean printing
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.style.zIndex = "-9999";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Collect all stylesheets and inline styles from main document head
  const headStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((s) => s.outerHTML)
    .join("\n");

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        ${headStyles}
        <style>
          @page {
            size: ${isLandscape ? "A4 landscape" : "A4 portrait"};
            margin: ${isLandscape ? "0mm" : "8mm"};
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: ${isLandscape ? "0" : "8px"} !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .print\\:hidden, .print-hidden, .no-print, button {
            display: none !important;
          }
          .print-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          /* Ensure modal container scrollbars or fixed max-height constraints are disabled */
          #${elementId} {
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
            left: auto !important;
            top: auto !important;
          }
        </style>
      </head>
      <body>
        <div id="${elementId}">
          ${sourceElem.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Give iframe enough time to render fonts/styles before printing
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Iframe print error, falling back to window.print():", e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}
