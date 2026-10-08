
// ============================================================
// OUR STORY
// Firebase + Memory System
// ============================================================

import {
    db,
    storage
} from "../firebase.js";


// ============================================================
// FIRESTORE
// ============================================================

import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    startAfter,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";


// ============================================================
// FIREBASE STORAGE
// ============================================================

import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from
    "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";


// ============================================================
// CONFIG
// ============================================================

const CONFIG = {

    COLLECTION_NAME:
        "memories",

    STORAGE_FOLDER:
        "memories",

    PAGE_SIZE:
        8,

    MAX_FILE_SIZE:
        10 * 1024 * 1024,

    ALLOWED_TYPES: [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

};


// ============================================================
// STATE
// ============================================================

let memories = [];

let lastVisibleDocument = null;

let isLoadingMemories = false;

let allMemoriesLoaded = false;

let selectedFile = null;


// ============================================================
// DOM
// ============================================================

const pageLoader =
    document.getElementById("pageLoader");

const navbar =
    document.getElementById("navbar");


// FORM

const memoryForm =
    document.getElementById("memoryForm");

const memoryImage =
    document.getElementById("memoryImage");

const imagePreview =
    document.getElementById("imagePreview");

const imagePreviewImage =
    document.getElementById("imagePreviewImage");

const memoryTitle =
    document.getElementById("memoryTitle");

const memoryDate =
    document.getElementById("memoryDate");

const memoryLocation =
    document.getElementById("memoryLocation");

const memoryStory =
    document.getElementById("memoryStory");

const saveMemoryButton =
    document.getElementById("saveMemoryButton");


// MEMORY GRID

const memoryGrid =
    document.getElementById("memoryGrid");

const loadMoreMemories =
    document.getElementById("loadMoreMemories");


// MODAL

const memoryModal =
    document.getElementById("memoryModal");

const closeMemoryModal =
    document.getElementById("closeMemoryModal");

const modalBackdrop =
    memoryModal?.querySelector(".modal-backdrop");

const modalMemoryImage =
    document.getElementById("modalMemoryImage");

const modalMemoryDate =
    document.getElementById("modalMemoryDate");

const modalMemoryTitle =
    document.getElementById("modalMemoryTitle");

const modalMemoryLocation =
    document.getElementById("modalMemoryLocation");

const modalMemoryStory =
    document.getElementById("modalMemoryStory");


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);


async function initializeApplication() {

    try {

        setupEventListeners();

        setupNavigation();

        setupImagePreview();

        await loadInitialMemories();

    } catch (error) {

        console.error(
            "Application initialization error:",
            error
        );

        showToast(
            "Terjadi kesalahan saat memuat website.",
            "error"
        );

    } finally {

        hidePageLoader();

    }

}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {


    // --------------------------------------------------------
    // MEMORY FORM
    // --------------------------------------------------------

    if (memoryForm) {

        memoryForm.addEventListener(
            "submit",
            handleMemorySubmit
        );

    }


    // --------------------------------------------------------
    // IMAGE INPUT
    // --------------------------------------------------------

    if (memoryImage) {

        memoryImage.addEventListener(
            "change",
            handleImageSelection
        );

    }


    // --------------------------------------------------------
    // LOAD MORE
    // --------------------------------------------------------

    if (loadMoreMemories) {

        loadMoreMemories.addEventListener(
            "click",
            loadMoreMemoryData
        );

    }


    // --------------------------------------------------------
    // MODAL CLOSE
    // --------------------------------------------------------

    if (closeMemoryModal) {

        closeMemoryModal.addEventListener(
            "click",
            closeModal
        );

    }


    if (modalBackdrop) {

        modalBackdrop.addEventListener(
            "click",
            closeModal
        );

    }


    // --------------------------------------------------------
    // ESC KEY
    // --------------------------------------------------------

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                memoryModal?.classList.contains("active")
            ) {

                closeModal();

            }

        }
    );

}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

    const navLinks =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    navLinks.forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const targetId =
                    link.getAttribute("href");

                if (
                    !targetId ||
                    targetId === "#"
                ) {

                    return;

                }

                const target =
                    document.querySelector(
                        targetId
                    );

                if (!target) {

                    return;

                }

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth"
                });

            }
        );

    });


    // Navbar scroll effect

    window.addEventListener(
        "scroll",
        () => {

            if (!navbar) {

                return;

            }

            if (window.scrollY > 50) {

                navbar.classList.add(
                    "scrolled"
                );

            } else {

                navbar.classList.remove(
                    "scrolled"
                );

            }

        }
    );

}


// ============================================================
// IMAGE PREVIEW
// ============================================================

function setupImagePreview() {

    if (!memoryImage) {

        return;

    }

    memoryImage.addEventListener(
        "change",
        handleImageSelection
    );

}


function handleImageSelection(event) {

    const file =
        event.target.files?.[0];


    if (!file) {

        selectedFile = null;

        resetImagePreview();

        return;

    }


    // --------------------------------------------------------
    // FILE TYPE
    // --------------------------------------------------------

    if (
        !CONFIG.ALLOWED_TYPES.includes(
            file.type
        )
    ) {

        showToast(
            "Format foto harus JPG, PNG, atau WEBP.",
            "error"
        );

        memoryImage.value = "";

        selectedFile = null;

        resetImagePreview();

        return;

    }


    // --------------------------------------------------------
    // FILE SIZE
    // --------------------------------------------------------

    if (
        file.size >
        CONFIG.MAX_FILE_SIZE
    ) {

        showToast(
            "Ukuran foto maksimal 10 MB.",
            "error"
        );

        memoryImage.value = "";

        selectedFile = null;

        resetImagePreview();

        return;

    }


    selectedFile = file;


    // --------------------------------------------------------
    // PREVIEW
    // --------------------------------------------------------

    const reader =
        new FileReader();


    reader.onload =
        event => {

            if (
                imagePreviewImage &&
                imagePreview
            ) {

                imagePreviewImage.src =
                    event.target.result;

                imagePreview.hidden =
                    false;

                const dropzone =
                    document.querySelector(
                        ".upload-dropzone"
                    );

                if (dropzone) {

                    dropzone.style.display =
                        "none";

                }

            }

        };


    reader.onerror =
        () => {

            showToast(
                "Foto tidak dapat dibaca.",
                "error"
            );

        };


    reader.readAsDataURL(file);

}


// ============================================================
// RESET IMAGE
// ============================================================

function resetImagePreview() {

    if (imagePreview) {

        imagePreview.hidden =
            true;

    }


    if (imagePreviewImage) {

        imagePreviewImage.src =
            "";

    }


    const dropzone =
        document.querySelector(
            ".upload-dropzone"
        );

    if (dropzone) {

        dropzone.style.display =
            "flex";

    }

}


// ============================================================
// LOAD INITIAL MEMORIES
// ============================================================

async function loadInitialMemories() {

    if (isLoadingMemories) {

        return;

    }

    isLoadingMemories = true;


    try {

        const memoriesQuery =
            query(
                collection(
                    db,
                    CONFIG.COLLECTION_NAME
                ),
                orderBy(
                    "createdAt",
                    "desc"
                ),
                limit(
                    CONFIG.PAGE_SIZE
                )
            );


        const snapshot =
            await getDocs(
                memoriesQuery
            );


        memories = [];

        lastVisibleDocument =
            null;


        snapshot.forEach(
            documentSnapshot => {

                memories.push({
                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()
                });

            }
        );


        if (snapshot.size > 0) {

            lastVisibleDocument =
                snapshot.docs[
                    snapshot.docs.length - 1
                ];

        }


        if (
            snapshot.size <
            CONFIG.PAGE_SIZE
        ) {

            allMemoriesLoaded =
                true;

        }


        renderMemories();

    } catch (error) {

        console.error(
            "Failed to load memories:",
            error
        );


        /*
            Jika collection belum ada,
            Firestore akan mengembalikan
            collection kosong.

            Jadi website tetap bisa berjalan.
        */

        renderMememoriesEmpty();

    } finally {

        isLoadingMemories =
            false;

    }

}


// ============================================================
// LOAD MORE
// ============================================================

async function loadMoreMemoryData() {

    if (
        isLoadingMemories ||
        allMemoriesLoaded ||
        !lastVisibleDocument
    ) {

        return;

    }


    isLoadingMemories =
        true;


    setLoadMoreButtonLoading(
        true
    );


    try {

        const memoriesQuery =
            query(
                collection(
                    db,
                    CONFIG.COLLECTION_NAME
                ),
                orderBy(
                    "createdAt",
                    "desc"
                ),
                startAfter(
                    lastVisibleDocument
                ),
                limit(
                    CONFIG.PAGE_SIZE
                )
            );


        const snapshot =
            await getDocs(
                memoriesQuery
            );


        snapshot.forEach(
            documentSnapshot => {

                memories.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        if (snapshot.size > 0) {

            lastVisibleDocument =
                snapshot.docs[
                    snapshot.docs.length - 1
                ];

        }


        if (
            snapshot.size <
            CONFIG.PAGE_SIZE
        ) {

            allMemoriesLoaded =
                true;

        }


        renderMemories();

    } catch (error) {

        console.error(
            "Failed to load more memories:",
            error
        );

        showToast(
            "Gagal memuat memory tambahan.",
            "error"
        );

    } finally {

        isLoadingMemories =
            false;

        setLoadMoreButtonLoading(
            false
        );

    }

}


// ============================================================
// RENDER MEMORIES
// ============================================================

function renderMemories() {

    if (!memoryGrid) {

        return;

    }


    // --------------------------------------------------------
    // EMPTY
    // --------------------------------------------------------

    if (
        memories.length === 0
    ) {

        renderMememoriesEmpty();

        return;

    }


    memoryGrid.innerHTML =
        "";


    memories.forEach(
        (memory, index) => {

            const card =
                createMemoryCard(
                    memory,
                    index
                );

            memoryGrid.appendChild(
                card
            );

        }
    );


    updateLoadMoreButton();

}


// ============================================================
// EMPTY STATE
// ============================================================

function renderMememoriesEmpty() {

    if (!memoryGrid) {

        return;

    }


    memoryGrid.innerHTML = `

        <div class="memory-empty">

            <div class="memory-empty-symbol">
                猴
            </div>

            <h3>
                Our Story Is Waiting
            </h3>

            <p>
                Belum ada memory yang tersimpan.
                Tambahkan kenangan pertama kalian.
            </p>

        </div>

    `;


    if (loadMoreMemories) {

        loadMoreMemories.style.display =
            "none";

    }

}


// ============================================================
// CREATE MEMORY CARD
// ============================================================

function createMemoryCard(
    memory,
    index
) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "memory-card";


    if (index === 0) {

        article.classList.add(
            "memory-large"
        );

    }


    article.dataset.memoryId =
        memory.id;


    const imageWrapper =
        document.createElement(
            "div"
        );

    imageWrapper.className =
        "memory-image";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        memory.imageUrl || "";


    image.alt =
        escapeHtml(
            memory.title ||
            "Our Memory"
        );


    image.loading =
        "lazy";


    imageWrapper.appendChild(
        image
    );


    const overlay =
        document.createElement(
            "div"
        );

    overlay.className =
        "memory-overlay";


    const date =
        document.createElement(
            "span"
        );

    date.className =
        "memory-date";


    date.textContent =
        formatDate(
            memory.date
        );


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        memory.title ||
        "Untitled Memory";


    const story =
        document.createElement(
            "p"
        );


    story.textContent =
        createShortStory(
            memory.story
        );


    const location =
        document.createElement(
            "span"
        );

    location.className =
        "memory-location";


    location.textContent =
        memory.location
            ? `♧ ${memory.location}`
            : "";


    overlay.appendChild(
        date
    );

    overlay.appendChild(
        title
    );

    overlay.appendChild(
        story
    );

    overlay.appendChild(
        location
    );


    article.appendChild(
        imageWrapper
    );

    article.appendChild(
        overlay
    );


    article.addEventListener(
        "click",
        () => {

            openMemoryModal(
                memory
            );

        }
    );


    return article;

}


// ============================================================
// OPEN MODAL
// ============================================================

function openMemoryModal(
    memory
) {

    if (!memoryModal) {

        return;

    }


    if (modalMemoryImage) {

        modalMemoryImage.src =
            memory.imageUrl || "";

        modalMemoryImage.alt =
            memory.title ||
            "Memory";

    }


    if (modalMemoryDate) {

        modalMemoryDate.textContent =
            formatDate(
                memory.date
            );

    }


    if (modalMemoryTitle) {

        modalMemoryTitle.textContent =
            memory.title ||
            "Untitled Memory";

    }


    if (modalMemoryLocation) {

        if (memory.location) {

            modalMemoryLocation.textContent =
                `♧ ${memory.location}`;

            modalMemoryLocation.style.display =
                "block";

        } else {

            modalMemoryLocation.style.display =
                "none";

        }

    }


    if (modalMemoryStory) {

        modalMemoryStory.textContent =
            memory.story ||
            "No story available.";

    }


    memoryModal.classList.add(
        "active"
    );


    memoryModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

    if (!memoryModal) {

        return;

    }


    memoryModal.classList.remove(
        "active"
    );


    memoryModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


// ============================================================
// SUBMIT MEMORY
// ============================================================

async function handleMemorySubmit(
    event
) {

    event.preventDefault();


    // --------------------------------------------------------
    // VALIDATE
    // --------------------------------------------------------

    if (!selectedFile) {

        showToast(
            "Silakan pilih foto terlebih dahulu.",
            "error"
        );

        return;

    }


    const title =
        memoryTitle?.value.trim() || "";


    const date =
        memoryDate?.value || "";


    const location =
        memoryLocation?.value.trim() || "";


    const story =
        memoryStory?.value.trim() || "";


    if (!title) {

        showToast(
            "Judul memory belum diisi.",
            "error"
        );

        memoryTitle?.focus();

        return;

    }


    if (!date) {

        showToast(
            "Tanggal memory belum diisi.",
            "error"
        );

        memoryDate?.focus();

        return;

    }


    if (!story) {

        showToast(
            "Cerita memory belum diisi.",
            "error"
        );

        memoryStory?.focus();

        return;

    }


    // --------------------------------------------------------
    // DISABLE FORM
    // --------------------------------------------------------

    setFormLoading(
        true
    );


    try {

        // ----------------------------------------------------
        // CREATE UNIQUE FILE NAME
        // ----------------------------------------------------

        const timestamp =
            Date.now();


        const safeFileName =
            createSafeFileName(
                selectedFile.name
            );


        const storagePath =
            `${CONFIG.STORAGE_FOLDER}/${timestamp}_${safeFileName}`;


        // ----------------------------------------------------
        // STORAGE REFERENCE
        // ----------------------------------------------------

        const storageReference =
            ref(
                storage,
                storagePath
            );


        // ----------------------------------------------------
        // UPLOAD
        // ----------------------------------------------------

        const uploadTask =
            uploadBytesResumable(
                storageReference,
                selectedFile,
                {
                    contentType:
                        selectedFile.type
                }
            );


        await new Promise(
            (
                resolve,
                reject
            ) => {

                uploadTask.on(

                    "state_changed",

                    snapshot => {

                        const progress =
                            (
                                snapshot.bytesTransferred /
                                snapshot.totalBytes
                            ) * 100;


                        updateUploadProgress(
                            progress
                        );

                    },

                    error => {

                        console.error(
                            "Upload error:",
                            error
                        );

                        reject(
                            error
                        );

                    },

                    () => {

                        resolve();

                    }

                );

            }
        );


        // ----------------------------------------------------
        // GET DOWNLOAD URL
        // ----------------------------------------------------

        const imageUrl =
            await getDownloadURL(
                uploadTask.snapshot.ref
            );


        // ----------------------------------------------------
        // SAVE FIRESTORE DOCUMENT
        // ----------------------------------------------------

        const memoryData = {

            title:
                title,

            date:
                date,

            location:
                location,

            story:
                story,

            imageUrl:
                imageUrl,

            storagePath:
                storagePath,

            createdAt:
                serverTimestamp()

        };


        await addDoc(

            collection(
                db,
                CONFIG.COLLECTION_NAME
            ),

            memoryData

        );


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        showToast(
            "Memory berhasil disimpan ❤️",
            "success"
        );


        resetMemoryForm();


        // Reload memories

        await loadInitialMemories();


        // Scroll to memories

        document
            .getElementById(
                "memories"
            )
            ?.scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {

        console.error(
            "Failed to save memory:",
            error
        );


        handleFirebaseError(
            error
        );

    } finally {

        setFormLoading(
            false
        );

    }

}


// ============================================================
// UPLOAD PROGRESS
// ============================================================

function updateUploadProgress(
    progress
) {

    if (!saveMemoryButton) {

        return;

    }


    const rounded =
        Math.round(
            progress
        );


    saveMemoryButton.innerHTML = `

        <span>
            Uploading ${rounded}%
        </span>

        <span>
            ${rounded >= 100 ? "✓" : "↑"}
        </span>

    `;

}


// ============================================================
// FORM LOADING
// ============================================================

function setFormLoading(
    loading
) {

    if (!saveMemoryButton) {

        return;

    }


    saveMemoryButton.disabled =
        loading;


    if (loading) {

        saveMemoryButton.innerHTML = `

            <span>
                Preparing...
            </span>

            <span>
                ↑
            </span>

        `;

    } else {

        saveMemoryButton.innerHTML = `

            <span>
                Save This Memory
            </span>

            <span>
                ♥
            </span>

        `;

    }


    const fields =
        memoryForm?.querySelectorAll(
            "input, textarea, button"
        );


    fields?.forEach(
        field => {

            field.disabled =
                loading;

        }
    );

}


// ============================================================
// RESET FORM
// ============================================================

function resetMemoryForm() {

    memoryForm?.reset();


    selectedFile =
        null;


    resetImagePreview();


    updateUploadProgress(
        0
    );


    if (saveMemoryButton) {

        saveMemoryButton.innerHTML = `

            <span>
                Save This Memory
            </span>

            <span>
                ♥
            </span>

        `;

    }

}


// ============================================================
// LOAD MORE BUTTON
// ============================================================

function updateLoadMoreButton() {

    if (!loadMoreMemories) {

        return;

    }


    if (
        allMemoriesLoaded ||
        memories.length === 0
    ) {

        loadMoreMemories.style.display =
            "none";

        return;

    }


    loadMoreMemories.style.display =
        "flex";


    loadMoreMemories.disabled =
        false;


    loadMoreMemories.innerHTML = `

        <span>
            View More Memories
        </span>

        <span>
            →
        </span>

    `;

}


function setLoadMoreButtonLoading(
    loading
) {

    if (!loadMoreMemories) {

        return;

    }


    loadMoreMemories.disabled =
        loading;


    if (loading) {

        loadMoreMemories.innerHTML = `

            <span>
                Loading...
            </span>

            <span>
                ...
            </span>

        `;

    } else {

        updateLoadMoreButton();

    }

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "UNKNOWN DATE";

    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;

    }


    return new Intl.DateTimeFormat(
        "en-US",
        {
            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    ).format(
        date
    );

}


// ============================================================
// SHORT STORY
// ============================================================

function createShortStory(
    story
) {

    if (!story) {

        return "";

    }


    const maxLength =
        90;


    if (
        story.length <=
        maxLength
    ) {

        return story;

    }


    return (
        story.substring(
            0,
            maxLength
        ).trim() +
        "..."
    );

}


// ============================================================
// SAFE FILE NAME
// ============================================================

function createSafeFileName(
    fileName
) {

    return fileName

        .toLowerCase()

        .replace(
            /[^a-z0-9.]+/g,
            "-"
        )

        .replace(
            /^-+|-+$/g,
            ""
        );

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// ============================================================
// PAGE LOADER
// ============================================================

function hidePageLoader() {

    if (!pageLoader) {

        return;

    }


    pageLoader.style.opacity =
        "0";


    pageLoader.style.pointerEvents =
        "none";


    setTimeout(
        () => {

            pageLoader.style.display =
                "none";

        },
        400
    );

}


// ============================================================
// TOAST
// ============================================================

function showToast(
    message,
    type = "info"
) {

    let toast =
        document.getElementById(
            "appToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "appToast";


        document.body.appendChild(
            toast
        );


        const style =
            document.createElement(
                "style"
            );


        style.textContent = `

            #appToast {

                position: fixed;

                z-index: 10000;

                right: 25px;
                bottom: 25px;

                max-width: 360px;

                padding: 15px 20px;

                border-radius: 14px;

                background:
                    rgba(45,5,5,.95);

                color: white;

                box-shadow:
                    0 15px 40px
                    rgba(0,0,0,.25);

                font-size: 12px;

                line-height: 1.5;

                transform:
                    translateY(20px);

                opacity: 0;

                transition:
                    .3s ease;

                border:
                    1px solid
                    rgba(239,210,139,.25);

                backdrop-filter:
                    blur(10px);

            }

            #appToast.show {

                transform:
                    translateY(0);

                opacity: 1;

            }

            #appToast.success {

                border-color:
                    rgba(239,210,139,.55);

            }

            #appToast.error {

                border-color:
                    rgba(220,70,70,.55);

            }

            .memory-empty {

                grid-column:
                    1 / -1;

                padding:
                    80px 30px;

                text-align: center;

                color:
                    rgba(255,255,255,.6);

            }

            .memory-empty-symbol {

                color:
                    #efd28b;

                font-family:
                    "Noto Serif SC",
                    serif;

                font-size:
                    50px;

            }

            .memory-empty h3 {

                margin-top:
                    10px;

                color:
                    white;

                font-family:
                    "Cormorant Garamond",
                    serif;

                font-size:
                    35px;

                font-weight:
                    500;

            }

            .memory-empty p {

                margin-top:
                    10px;

                font-size:
                    13px;

            }

        `;


        document.head.appendChild(
            style
        );

    }


    toast.textContent =
        message;


    toast.className =
        `${type} show`;


    clearTimeout(
        toast._timeout
    );


    toast._timeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


// ============================================================
// FIREBASE ERROR HANDLER
// ============================================================

function handleFirebaseError(
    error
) {

    console.error(
        "Firebase error:",
        error
    );


    const code =
        error?.code || "";


    switch (code) {

        case "storage/unauthorized":

            showToast(
                "Upload ditolak oleh Storage Rules Firebase.",
                "error"
            );

            break;


        case "storage/canceled":

            showToast(
                "Upload dibatalkan.",
                "error"
            );

            break;


        case "storage/quota-exceeded":

            showToast(
                "Storage Firebase sudah melebihi quota.",
                "error"
            );

            break;


        case "permission-denied":

        case "firestore/permission-denied":

            showToast(
                "Firestore Rules menolak akses.",
                "error"
            );

            break;


        case "failed-precondition":

            showToast(
                "Firestore membutuhkan index atau konfigurasi tambahan.",
                "error"
            );

            break;


        case "unavailable":

            showToast(
                "Firebase sedang tidak tersedia. Coba lagi.",
                "error"
            );

            break;


        default:

            showToast(
                "Gagal menyimpan memory. Cek Console browser.",
                "error"
            );

    }

}


// ============================================================
// GLOBAL DEBUG
// ============================================================

window.OurStory = {

    reloadMemories:
        loadInitialMemories,

    openMemory:
        openMemoryModal,

    closeMemory:
        closeModal

};


// ============================================================
// END
// ============================================================
