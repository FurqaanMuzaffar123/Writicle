// ============================
// Element References
// ============================

const $writingArea = $("#text-input");

const $title = $("#title")
const $subtitle = $("#subtitle")

const $bold = $("#bold");
const $italic = $("#italic");
const $underline = $("#underline");
const $strikethrough = $("#strikethrough");
const $superscript = $("#superscript");
const $subscript = $("#subscript");

const $insertOrderedList = $("#insertOrderedList");
const $insertUnorderedList = $("#insertUnorderedList");

const $undo = $("#undo");
const $redo = $("#redo");

const $justifyLeft = $("#justifyLeft");
const $justifyCenter = $("#justifyCenter");
const $justifyRight = $("#justifyRight");
const $justifyFull = $("#justifyFull");

const $indent = $("#indent");
const $outdent = $("#outdent");

const $formatBlock = $("#formatBlock");
const $fontName = $("#fontName");
const $fontSizeRef = $("#fontSizeRef");
const $foreColor = $("#foreColor");
const $backColor = $("#backColor");

const $quote = $("#quote");
const $linkButton = $("#createLink");
const $unlinkButton = $("#unlink");

const $linkPopup = $("#linkPopup");
const $linkInput = $("#linkInput");

const $save = $("#save");
const $publish = $("#publish");

let articleData = {
  title: $title.val(),
  subtitle: $subtitle.val(),
  content: $writingArea.html(),
  coverImage: $("#coverImagePreview").attr("src") || ""
}

let savedSelection = null;


// ============================
// Initialization
// ============================

const fontList = [
  "Arial",
  "Verdana",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Montserrat",
  "Domine",
];

$(document).ready(() => {
  // Populate fonts
  fontList.forEach(font => {
    $("<option>", { value: font, text: font }).appendTo($fontName);
  });
  $fontName.val("Arial")

  // Populate font sizes (1–7)
  for (let i = 1; i <= 7; i++) {
    $("<option>", { value: i, text: i }).appendTo($fontSizeRef);
  }
  $fontSizeRef.val(3);

  $(".option-button").on("mousedown", e => e.preventDefault());
  document.execCommand("hiliteColor", false, "#ffffff")
});


// ============================
// Command Binding Helper
// ============================

function bindCommand($btn, command, value = null) {
  $btn.on("click", e => {
    e.preventDefault();
    $writingArea.focus();
    document.execCommand(command, false, value);
    syncToolbar();
  });
}


// ============================
// Formatting Commands
// ============================

bindCommand($bold, "bold");
bindCommand($italic, "italic");
bindCommand($underline, "underline");
bindCommand($strikethrough, "strikeThrough");
bindCommand($superscript, "superscript");
bindCommand($subscript, "subscript");

// Lists
bindCommand($insertOrderedList, "insertOrderedList");
bindCommand($insertUnorderedList, "insertUnorderedList");

// Undo / Redo
bindCommand($undo, "undo");
bindCommand($redo, "redo");

// Alignment
bindCommand($justifyLeft, "justifyLeft");
bindCommand($justifyCenter, "justifyCenter");
bindCommand($justifyRight, "justifyRight");
bindCommand($justifyFull, "justifyFull");

// Indentation
bindCommand($indent, "indent");
bindCommand($outdent, "outdent");


// ============================
// Font / Color Controls
// ============================

$formatBlock.on("change", function () {
  $writingArea.focus();
  document.execCommand("formatBlock", false, this.value);
});

$fontName.on("change", function () {
  $writingArea.focus();
  document.execCommand("fontName", false, this.value);
});

$fontSizeRef.on("change", function () {
  $writingArea.focus();
  document.execCommand("fontSize", false, this.value);
});

$foreColor.on("input", function () {
  $writingArea.focus();
  document.execCommand("foreColor", false, this.value);
});

$backColor.on("input", function () {
  $writingArea.focus();
  document.execCommand("hiliteColor", false, this.value);
});


// ============================
// Quote Toggle (FIXED)
// ============================
$quote.on("click", e => {
  e.preventDefault();
  $writingArea.focus();
  const sel = document.getSelection();

  if (sel.rangeCount > 0) {
    let node = sel.anchorNode;

    while (node && node !== document.body) {
      if (node.nodeName === 'BLOCKQUOTE') {
        // FIXED: Move ALL children out, not just first child
        const parent = node.parentNode;
        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);// Remove empty blockquote
        return;
      }
      node = node.parentNode;
    }

    document.execCommand("formatBlock", false, "blockquote");
    node = sel.anchorNode;

    while (node && node !== document.body) {
      if (node.nodeName === 'BLOCKQUOTE') {
        $(node).addClass("quote");
        $(node).attr("data-tip", "Use subscript to write the author name.")
        $quote.mouseenter()
        return; // or return
      }
      node = node.parentNode;
    }
  }
});

// Helper function to unwrap/remove blockquote
function unwrapBlockquote(blockquote) {
  const parent = blockquote.parentNode;

  // Move all children out of the blockquote
  while (blockquote.firstChild) {
    // Skip the <sub> author element when unwrapping
    if (blockquote.firstChild.nodeName === "SUB") {
      blockquote.removeChild(blockquote.firstChild);
    } else {
      parent.insertBefore(blockquote.firstChild, blockquote);
    }
  }

  // Remove the empty blockquote
  parent.removeChild(blockquote);
}


// ============================
// Link Handling
// ============================

$linkButton.on("click", () => {
  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) {
    alert("Please select some text first.");
    return;
  }

  savedSelection = sel.getRangeAt(0).cloneRange();
  showLinkPopup();
});

$("#applyLink").on("click", () => {
  const url = $linkInput.val().trim();
  if (!url || !savedSelection) return;

  restoreSelection(savedSelection);
  document.execCommand("createLink", false, normalizeUrl(url));
  hideLinkPopup();
});

$("#cancelLink").on("click", hideLinkPopup);

$unlinkButton.on("click", e => {
  e.preventDefault();
  $writingArea.focus();
  document.execCommand("unlink");
  syncToolbar();
});

function showLinkPopup() {
  $linkInput.val("");
  $linkPopup.removeClass("hidden");
  $linkInput.focus();
}

function hideLinkPopup() {
  $linkPopup.addClass("hidden");
  savedSelection = null;
}

function restoreSelection(range) {
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function normalizeUrl(url) {
  if (!/^https?:\/\//i.test(url)) {
    return "http://" + url;
  }
  return url;
}


// ============================
// Toolbar Sync
// ============================

function syncToolbar() {
  $bold.toggleClass("active", document.queryCommandState("bold"));
  $italic.toggleClass("active", document.queryCommandState("italic"));
  $underline.toggleClass("active", document.queryCommandState("underline"));
  $strikethrough.toggleClass("active", document.queryCommandState("strikeThrough"));
  $superscript.toggleClass("active", document.queryCommandState("superscript"));
  $subscript.toggleClass("active", document.queryCommandState("subscript"));

  $justifyLeft.toggleClass("active", document.queryCommandState("justifyLeft"));
  $justifyCenter.toggleClass("active", document.queryCommandState("justifyCenter"));
  $justifyRight.toggleClass("active", document.queryCommandState("justifyRight"));
  $justifyFull.toggleClass("active", document.queryCommandState("justifyFull"));

  // Sync font name
  let fontName = document.queryCommandValue("fontName");

  // Fallback to computed style if execCommand returns empty
  if (!fontName) {
    fontName = getCaretFontFamily();
  }

  if (fontName) {
    const cleanFont = fontName.replace(/['"]/g, '');
    $fontName.val(cleanFont);
  }

  // Sync font size
  const fontSize = document.queryCommandValue("fontSize");
  if (fontSize) {
    $fontSizeRef.val(fontSize);
  }

  // Sync text color
  const foreColor = document.queryCommandValue("foreColor");
  if (foreColor) {
    // Convert rgb() to hex if needed
    $foreColor.val(rgbToHex(foreColor));
  }

  // Sync background color (highlight)
  const backColor = document.queryCommandValue("hiliteColor") || document.queryCommandValue("backColor");
  if (backColor) {
    $backColor.val(rgbToHex(backColor));
  }
}

// Helper function to convert RGB to Hex for color inputs
function rgbToHex(rgb) {
  // If already hex, return it
  if (rgb.startsWith('#')) return rgb;

  // Parse rgb(r, g, b) format
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Sync when caret changes
document.addEventListener("selectionchange", () => {
  if (document.activeElement === $writingArea[0]) {
    syncToolbar();
  }
});

// Handle Enter key in blockquote author field
$writingArea.on("keydown", function (e) {
  if (e.key === "Enter") {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      let node = selection.anchorNode;

      // Check if we're in a <sub> inside a blockquote
      while (node && node !== $writingArea[0]) {
        if (node.nodeName === "SUB") {
          // Check if it's inside a blockquote (not just immediate parent)
          let parent = node.parentNode;
          while (parent && parent !== $writingArea[0]) {
            if (parent.nodeName === "BLOCKQUOTE") {
              e.preventDefault();

              // Create a new paragraph after the blockquote
              const newParagraph = document.createElement("div");
              newParagraph.innerHTML = "<br>";
              if (parent.nextSibling) {
                parent.parentNode.insertBefore(newParagraph, parent.nextSibling);
              } else {
                parent.parentNode.appendChild(newParagraph);
              }

              // Move cursor to the new paragraph
              const range = document.createRange();
              range.setStart(newParagraph, 0);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
              newParagraph.focus();

              return false;
            }
            parent = parent.parentNode;
          }
        }
        node = node.parentNode;
      }
    }
  }
});

$.each([$title, $subtitle], (_, e) => {
  e.on("input", () => {
    autoResize(e)
  })
})

$title.on("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault(); // Stop Enter from being inserted
    $subtitle.focus();
  }
});


$subtitle.on("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault()
    window.location.href = "#editor"
  }
})

function autoResize(el) {
  const maxHeight = 206; // Maximum height in pixels
  el.style.height = 'auto';

  if (el.scrollHeight > maxHeight) {
    el.style.height = maxHeight + 'px';
    el.style.overflowY = 'auto'; // Enable scrolling
  } else {
    el.style.height = el.scrollHeight + 'px';
    el.style.overflowY = 'hidden'; // Hide scrollbar when not needed
  }
}

$quote.on("mouseenter", () => {
  const quotes = $(".quote")
  if (quotes.length == 0) {
    return
  } else if (quotes.length == 1) {
    quotes.addClass("show-after")
  } else {
    quotes[0].classList.add("show-after")
  }
})

$quote.on("mouseleave", () => {
  const quotes = $(".quote")
  if (quotes.length == 0) {
    return
  } else if (quotes.length == 1) {
    quotes.removeClass("show-after")
  } else {
    quotes[0].classList.remove("show-after")
  }
})

function getCaretFontFamily() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return null;

  let node = sel.anchorNode;

  // If it's a text node, move to its element parent
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }

  if (!node || node === document) return null;

  const style = window.getComputedStyle(node);
  if (!style || !style.fontFamily) return null;

  // Extract first font name and remove quotes
  return style.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
}

// ============================
// Cover Image Handling
// ============================

function handleCoverImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      $("#coverImagePreview").attr("src", e.target.result);
      $("#coverImageSection").addClass("has-image");
    };

    reader.readAsDataURL(file);
  }
}

function removeCoverImage(event) {
  event.stopPropagation(); // Prevent triggering the file input click
  
  $("#coverImageInput").val(""); // Clear the input
  $("#coverImagePreview").attr("src", "");
  $("#coverImageSection").removeClass("has-image");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const msg = document.getElementById("toast-message");

  msg.textContent = message;

  toast.classList.remove("hidden");

  // trigger animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // auto hide after 3 sec
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 300);
  }, 3000);
}

$save.on("click", () => {
  articleData.title = $title.val();
  articleData.subtitle = $subtitle.val();
  articleData.content = $writingArea.html();
  articleData.coverImage = $("#coverImagePreview").attr("src");
})

$publish.on("click", () => {
  articleData.title = $title.val();
  articleData.subtitle = $subtitle.val();
  articleData.content = $writingArea.html();
  articleData.coverImage = $("#coverImagePreview").attr("src");
  if (!articleData.title){
    showToast("Provide a title.")
  }
  if(!articleData.subtitle){
    showToast("Provide a subtitle.")
  }
  if (!articleData.content){
    showToast("provide content pls")
  }
})
