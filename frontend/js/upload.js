// ── Upload Page Logic ──────────────────────────────────────────────
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileList = document.getElementById("file-list");
const uploadBtnWrapper = document.getElementById("upload-btn-wrapper");
const uploadBtn = document.getElementById("upload-btn");
const overlay = document.getElementById("processing-overlay");

let selectedFiles = [];

// ── Drag & Drop ───────────────────────────────────────────────────
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    addFiles(files);
});

fileInput.addEventListener("change", () => {
    addFiles(Array.from(fileInput.files));
    fileInput.value = "";
});

function addFiles(files) {
    files.forEach(file => {
        if (!selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });
    renderFileList();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

function renderFileList() {
    fileList.innerHTML = "";
    selectedFiles.forEach((file, i) => {
        const el = document.createElement("div");
        el.className = "file-item";
        el.innerHTML = `
            <div class="file-info">
                <div class="file-icon"><i class="fa-solid fa-file-pdf"></i></div>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatSize(file.size)}</div>
                </div>
            </div>
            <button class="remove-btn" data-index="${i}" title="Remove"><i class="fa-solid fa-xmark"></i></button>
        `;
        fileList.appendChild(el);
    });

    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeFile(parseInt(btn.dataset.index));
        });
    });

    uploadBtnWrapper.style.display = selectedFiles.length > 0 ? "block" : "none";
}

// ── Upload Handler ────────────────────────────────────────────────
uploadBtn.addEventListener("click", async () => {
    if (selectedFiles.length === 0) return;

    overlay.classList.add("active");
    updateStep("step-upload", "active");

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append("files", file));

    try {
        setTimeout(() => updateStep("step-upload", "done"), 500);
        setTimeout(() => updateStep("step-convert", "active"), 600);
        setTimeout(() => updateStep("step-convert", "done"), 1500);
        setTimeout(() => updateStep("step-ocr", "active"), 1600);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        updateStep("step-ocr", "done");
        updateStep("step-parse", "active");

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Upload failed");
        }

        const data = await response.json();

        updateStep("step-parse", "done");
        updateStep("step-store", "active");

        await new Promise(r => setTimeout(r, 400));
        updateStep("step-store", "done");

        sessionStorage.setItem("ocr_results", JSON.stringify(data.results));
        await new Promise(r => setTimeout(r, 600));
        window.location.href = "/results";

    } catch (error) {
        overlay.classList.remove("active");
        showToast("Error: " + error.message, "error");
    }
});

function updateStep(stepId, status) {
    const step = document.getElementById(stepId);
    if (!step) return;
    step.classList.remove("active", "done");
    step.classList.add(status);

    const icon = step.querySelector('i');
    if (icon) {
        if (status === "done") {
            icon.className = "fa-solid fa-circle-check";
        } else if (status === "active") {
            icon.className = "fa-solid fa-spinner fa-spin";
        }
    }
}
