import { initializeApp } from "firebase/app";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
    doc
} from "firebase/firestore";


// ========================================
// FIREBASE
// ========================================

const firebaseConfig = {

    apiKey:
        "AIzaSyCU7XuCy7Fcd1hABh3WinJMeHmOEcnA6Euo",

    authDomain:
        "ozel-ders-90130.firebaseapp.com",

    projectId:
        "ozel-ders-90130",

    storageBucket:
        "ozel-ders-90130.firebasestorage.app",

    messagingSenderId:
        "962005056882",

    appId:
        "1:962005056882:web:967f4b309155038b5f31eb",

    measurementId:
        "G-CPRWQSLN47"
};


const app =
    initializeApp(firebaseConfig);

const db =
    getFirestore(app);


// ========================================
// MÜSAİTLİK GÜNLERİ
// ========================================

const availability = {

    "Salı": {
        start: 15 * 60,
        end: 21 * 60
    },

    "Çarşamba": {
        start: 15 * 60,
        end: 21 * 60
    },

    "Perşembe": {
        start: 15 * 60,
        end: 21 * 60
    },

    "Cuma": {
        start: 15 * 60,
        end: 21 * 60
    },

    "Cumartesi": {
        start: 9 * 60,
        end: 12 * 60
    },

    "Pazar": {
        start: 11 * 60,
        end: 20 * 60
    }

};


// ========================================
// DEĞİŞKENLER
// ========================================

let selectedSlots = [];

let allAvailability = [];

let editingDocumentId = null;

let hasUnsavedChanges = false;


// ========================================
// SAAT FORMAT
// ========================================

function minutesToTime(minutes) {

    const hour =
        Math.floor(minutes / 60);

    const minute =
        minutes % 60;

    return (
        String(hour).padStart(2, "0") +
        ":" +
        String(minute).padStart(2, "0")
    );
}


// ========================================
// SÜRE FORMAT
// ========================================

function formatDuration(duration) {

    if (duration === 1) {
        return "1 saat";
    }

    if (duration === 1.5) {
        return "1,5 saat";
    }

    if (duration === 2) {
        return "2 saat";
    }

    return `${duration} saat`;
}


// ========================================
// SAATLERİ OLUŞTUR
// ========================================

function generateTimes(day) {

    const settings =
        availability[day];

    const times = [];

    for (
        let minutes = settings.start;
        minutes <= settings.end;
        minutes += 30
    ) {

        times.push(
            minutesToTime(minutes)
        );

    }

    return times;
}


// ========================================
// GÜN AÇIKLAMASI
// ========================================

function getDayDescription(day) {

    const settings =
        availability[day];

    return (
        `${minutesToTime(settings.start)} - ` +
        `${minutesToTime(settings.end)} arası`
    );
}


// ========================================
// GÜNLERİ OLUŞTUR
// ========================================

function createDays() {

    const container =
        document.getElementById(
            "daysContainer"
        );

    if (!container) {

        console.error(
            "daysContainer bulunamadı."
        );

        return;
    }

    container.innerHTML = "";

    Object.keys(availability)
        .forEach(day => {

            const dayCard =
                document.createElement(
                    "div"
                );

            dayCard.className =
                "day-card";


            // GÜN BAŞLIĞI

            const header =
                document.createElement(
                    "div"
                );

            header.className =
                "day-header";


            const dayName =
                document.createElement(
                    "div"
                );

            dayName.className =
                "day-name";

            dayName.textContent =
                day;


            const dayInfo =
                document.createElement(
                    "div"
                );

            dayInfo.className =
                "day-info";

            dayInfo.textContent =
                getDayDescription(day);


            header.appendChild(dayName);

            header.appendChild(dayInfo);


            // SAAT GRID

            const timeGrid =
                document.createElement(
                    "div"
                );

            timeGrid.className =
                "time-grid";


            const times =
                generateTimes(day);


            times.forEach(time => {

                const wrapper =
                    document.createElement(
                        "div"
                    );

                wrapper.className =
                    "time-wrapper";


                // SAAT BUTONU

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "time-button";

                button.textContent =
                    time;

                button.dataset.day =
                    day;

                button.dataset.time =
                    time;


                button.addEventListener(
                    "click",
                    function(event) {

                        event.preventDefault();

                        event.stopPropagation();

                        handleTimeClick(
                            day,
                            time
                        );

                    }
                );


                // ÖĞRENCİLER

                const students =
                    document.createElement(
                        "div"
                    );

                students.className =
                    "other-students";

                students.dataset.day =
                    day;

                students.dataset.time =
                    time;


                wrapper.appendChild(button);

                wrapper.appendChild(students);

                timeGrid.appendChild(wrapper);

            });


            dayCard.appendChild(header);

            dayCard.appendChild(timeGrid);

            container.appendChild(dayCard);

        });


    updateButtonStates();

    updateOtherStudents();

}


// ========================================
// SAATE TIKLAMA
// ========================================

function handleTimeClick(day, time) {

    showDurationMenu(
        day,
        time
    );

}


// ========================================
// DEĞİŞİKLİK YAPILDI
// ========================================

function markAsChanged() {

    if (!editingDocumentId) {
        return;
    }

    hasUnsavedChanges = true;

    showUnsavedNotice();

    updateSaveButton();

    updateOtherStudents();

}


// ========================================
// KAYDEDİLMEMİŞ DEĞİŞİKLİK UYARISI
// ========================================

function showUnsavedNotice() {

    const notice =
        document.getElementById(
            "unsavedNotice"
        );

    if (!notice) {
        return;
    }

    notice.classList.remove(
        "hidden"
    );

}


// ========================================
// KAYDET BUTONU
// ========================================

function updateSaveButton() {

    const saveButton =
        document.getElementById(
            "saveButton"
        );

    if (!saveButton) {
        return;
    }

    if (editingDocumentId) {

        saveButton.textContent =
            hasUnsavedChanges
                ? "💾 Değişiklikleri Kaydet"
                : "💾 Müsaitliklerimi Güncelle";

    }

}


// ========================================
// SÜRE MENÜSÜ
// ========================================

function showDurationMenu(day, time) {

    const oldPopup =
        document.querySelector(
            ".duration-popup"
        );

    if (oldPopup) {
        oldPopup.remove();
    }


    const target =
        Array.from(
            document.querySelectorAll(
                ".time-button"
            )
        ).find(
            button =>
                button.dataset.day === day &&
                button.dataset.time === time
        );


    if (!target) {

        console.error(
            "Saat butonu bulunamadı:",
            day,
            time
        );

        return;
    }


    const existingSlot =
        selectedSlots.find(
            slot =>
                slot.day === day &&
                slot.time === time
        );


    const currentDuration =
        existingSlot
            ? existingSlot.duration
            : null;


    // POPUP

    const popup =
        document.createElement(
            "div"
        );

    popup.className =
        "duration-popup";


    popup.innerHTML = `

        <div class="popup-title">
            ${day} ${time}
        </div>

        <div class="popup-subtitle">
            Bu ders kaç saat olsun?
        </div>

        <div class="popup-buttons">

            <button
                type="button"
                data-duration="1"
            >
                1 saat
            </button>

            <button
                type="button"
                data-duration="1.5"
            >
                1,5 saat
            </button>

            <button
                type="button"
                data-duration="2"
            >
                2 saat
            </button>

            ${
                currentDuration
                    ? `
                        <button
                            type="button"
                            class="remove-button"
                            data-remove="true"
                        >
                            🗑️ Bu saati kaldır
                        </button>
                    `
                    : ""
            }

        </div>
    `;


    document.body.appendChild(popup);


    // ========================================
    // POPUP KONUMU
    // ========================================

    const rect =
        target.getBoundingClientRect();


    const isMobile =
        window.innerWidth <= 600;


    const popupWidth =
        isMobile
            ? Math.min(
                210,
                window.innerWidth - 20
            )
            : 220;


    let left =
        rect.left;


    let top =
        rect.bottom + 8;


    // SAĞA TAŞMASIN

    left =
        Math.min(
            left,
            window.innerWidth -
            popupWidth -
            10
        );


    // SOLA TAŞMASIN

    left =
        Math.max(
            10,
            left
        );


    // ALTTA YER YOKSA ÜSTE AÇ

    const estimatedPopupHeight =
        popup.offsetHeight || 220;


    if (
        top + estimatedPopupHeight >
        window.innerHeight - 10
    ) {

        top =
            rect.top -
            estimatedPopupHeight -
            8;

    }


    // ÜSTTEN TAŞMASIN

    top =
        Math.max(
            10,
            top
        );


    popup.style.width =
        `${popupWidth}px`;

    popup.style.left =
        `${left}px`;

    popup.style.top =
        `${top}px`;


    // ========================================
    // SÜRE SEÇ
    // ========================================

    popup
        .querySelectorAll(
            "[data-duration]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function(event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const duration =
                            parseFloat(
                                this.dataset.duration
                            );


                        const index =
                            selectedSlots.findIndex(
                                slot =>
                                    slot.day === day &&
                                    slot.time === time
                            );


                        const newSlot = {

                            day:
                                day,

                            time:
                                time,

                            duration:
                                duration

                        };


                        if (
                            index !== -1
                        ) {

                            selectedSlots[index] =
                                newSlot;

                        }

                        else {

                            selectedSlots.push(
                                newSlot
                            );

                        }


                        popup.remove();


                        updateButtonStates();

                        // EKRANI ANINDA GÜNCELLE
                        updateOtherStudents();

                        // DÜZENLEME MODUNDA DEĞİŞİKLİK VAR
                        markAsChanged();

                    }
                );

            }
        );


    // ========================================
    // SEÇİMİ KALDIR
    // ========================================

    const removeButton =
        popup.querySelector(
            "[data-remove]"
        );


    if (removeButton) {

        removeButton.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                event.stopPropagation();


                const index =
                    selectedSlots.findIndex(
                        slot =>
                            slot.day === day &&
                            slot.time === time
                    );


                if (
                    index !== -1
                ) {

                    selectedSlots.splice(
                        index,
                        1
                    );

                }


                popup.remove();


                updateButtonStates();

                // ETİKETİ ANINDA KALDIR
                updateOtherStudents();

                // DEĞİŞİKLİK OLARAK İŞARETLE
                markAsChanged();

            }
        );

    }


    // ========================================
    // DIŞARI TIKLAMA
    // ========================================

    setTimeout(
        () => {

            function closePopup(event) {

                if (
                    !popup.contains(
                        event.target
                    ) &&
                    event.target !== target
                ) {

                    popup.remove();

                    document.removeEventListener(
                        "click",
                        closePopup
                    );

                }

            }


            document.addEventListener(
                "click",
                closePopup
            );

        },
        100
    );

}


// ========================================
// BUTON RENKLERİ
// ========================================

function updateButtonStates() {

    document
        .querySelectorAll(
            ".time-button"
        )
        .forEach(
            button => {

                const selected =
                    selectedSlots.some(
                        slot =>
                            slot.day ===
                                button.dataset.day &&
                            slot.time ===
                                button.dataset.time
                    );


                button.classList.toggle(
                    "selected",
                    selected
                );

            }
        );

}


// ========================================
// FIREBASE
// ========================================

const availabilityQuery =
    query(
        collection(
            db,
            "availability"
        ),
        orderBy(
            "createdAt",
            "desc"
        )
    );


onSnapshot(
    availabilityQuery,

    snapshot => {

        allAvailability = [];


        snapshot.forEach(
            documentSnapshot => {

                allAvailability.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        updateOtherStudents();

    },

    error => {

        console.error(
            "Firebase okuma hatası:",
            error
        );

    }
);


// ========================================
// DİĞER ÖĞRENCİLER
// ========================================

function updateOtherStudents() {

    document
        .querySelectorAll(
            ".other-students"
        )
        .forEach(
            element => {

                const day =
                    element.dataset.day;

                const time =
                    element.dataset.time;

                const students = [];


                allAvailability.forEach(
                    record => {

                        /*
                         * DÜZENLEME YAPAN ÖĞRENCİ
                         *
                         * Firestore'daki eski kaydı değil,
                         * ekrandaki geçici selectedSlots'u kullan.
                         *
                         * Böylece kullanıcı değişiklik yaptığında
                         * ekran anında değişir.
                         */

                        let slots;


                        if (
                            editingDocumentId &&
                            record.id === editingDocumentId
                        ) {

                            slots =
                                selectedSlots;

                        }

                        else {

                            slots =
                                record.availableTimes ||
                                [];

                        }


                        slots.forEach(
                            slot => {

                                if (
                                    slot.day === day &&
                                    slot.time === time
                                ) {

                                    students.push({

                                        name:
                                            record.studentName,

                                        duration:
                                            slot.duration ??
                                            record.duration ??
                                            1

                                    });

                                }

                            }
                        );

                    }
                );


                element.innerHTML = "";


                students.forEach(
                    student => {

                        const tag =
                            document.createElement(
                                "span"
                            );

                        tag.className =
                            "student-tag";

                        tag.textContent =
                            `${student.name} · ${formatDuration(student.duration)}`;

                        element.appendChild(tag);

                    }
                );

            }
        );

}


// ========================================
// YENİ KAYIT
// ========================================

async function createNewAvailability() {

    const studentName =
        document
            .getElementById(
                "studentName"
            )
            .value
            .trim();


    const editCode =
        document
            .getElementById(
                "editCode"
            )
            .value
            .trim();


    if (!studentName) {

        alert(
            "Lütfen öğrenci adını yazınız."
        );

        return;

    }


    if (
        !/^\d{4}$/.test(
            editCode
        )
    ) {

        alert(
            "Lütfen 4 haneli bir düzenleme şifresi oluşturunuz."
        );

        return;

    }


    if (
        selectedSlots.length === 0
    ) {

        alert(
            "Lütfen en az bir saat seçiniz."
        );

        return;

    }


    const saveButton =
        document.getElementById(
            "saveButton"
        );


    saveButton.disabled =
        true;

    saveButton.textContent =
        "⏳ Kaydediliyor...";


    try {

        await addDoc(
            collection(
                db,
                "availability"
            ),
            {

                studentName:
                    studentName,

                editCode:
                    editCode,

                availableTimes:
                    selectedSlots,

                createdAt:
                    new Date()

            }
        );


        alert(
            "Müsaitlikleriniz başarıyla kaydedildi! 🎉\n\nDüzenleme şifrenizi unutmayınız."
        );


        clearForm();

    }


    catch (error) {

        console.error(
            error
        );


        alert(
            "Kayıt sırasında bir hata oluştu.\n\n" +
            error.message
        );

    }


    finally {

        saveButton.disabled =
            false;

        saveButton.textContent =
            "🚀 Müsaitliklerimi Gönder";

    }

}


// ========================================
// DÜZENLEME
// ========================================

function editAvailability() {

    const studentName =
        document
            .getElementById(
                "studentName"
            )
            .value
            .trim();


    const editCode =
        document
            .getElementById(
                "editCode"
            )
            .value
            .trim();


    if (!studentName) {

        alert(
            "Lütfen öğrenci adınızı yazınız."
        );

        return;

    }


    if (
        !/^\d{4}$/.test(
            editCode
        )
    ) {

        alert(
            "Lütfen 4 haneli düzenleme şifrenizi giriniz."
        );

        return;

    }


    const record =
        allAvailability.find(
            item => {

                const savedName =
                    (
                        item.studentName ||
                        ""
                    )
                    .trim()
                    .toLowerCase();


                const enteredName =
                    studentName
                        .trim()
                        .toLowerCase();


                return (
                    savedName === enteredName &&
                    item.editCode === editCode
                );

            }
        );


    if (!record) {

        alert(
            "Bu ad ve düzenleme şifresiyle eşleşen kayıt bulunamadı."
        );

        return;

    }


    editingDocumentId =
        record.id;


    selectedSlots =
        record.availableTimes
            ? record.availableTimes.map(
                slot => ({

                    day:
                        slot.day,

                    time:
                        slot.time,

                    duration:
                        slot.duration ??
                        1

                })
            )
            : [];


    hasUnsavedChanges =
        false;


    updateButtonStates();

    updateOtherStudents();


    const badge =
        document.getElementById(
            "editingBadge"
        );


    badge.textContent =
        `✏️ ${record.studentName} adlı öğrencinin müsaitliklerini düzenliyorsunuz.`;

    badge.classList.remove(
        "hidden"
    );


    const notice =
        document.getElementById(
            "unsavedNotice"
        );


    if (notice) {

        notice.classList.add(
            "hidden"
        );

    }


    updateSaveButton();


    document
        .getElementById(
            "daysContainer"
        )
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


// ========================================
// GÜNCELLE
// ========================================

async function updateAvailability() {

    if (!editingDocumentId) {

        await createNewAvailability();

        return;

    }


    const saveButton =
        document.getElementById(
            "saveButton"
        );


    saveButton.disabled =
        true;

    saveButton.textContent =
        "⏳ Güncelleniyor...";


    try {

        const recordRef =
            doc(
                db,
                "availability",
                editingDocumentId
            );


        await updateDoc(
            recordRef,
            {

                availableTimes:
                    selectedSlots,

                updatedAt:
                    new Date()

            }
        );


        hasUnsavedChanges =
            false;


        alert(
            selectedSlots.length === 0
                ? "Tüm müsaitlikleriniz kaldırıldı. 🎉"
                : "Müsaitlikleriniz güncellendi! 🎉"
        );


        clearForm();

    }


    catch (error) {

        console.error(
            error
        );


        alert(
            "Güncelleme sırasında bir hata oluştu.\n\n" +
            error.message
        );

    }


    finally {

        saveButton.disabled =
            false;

        saveButton.textContent =
            "🚀 Müsaitliklerimi Gönder";

    }

}


// ========================================
// FORMU TEMİZLE
// ========================================

function clearForm() {

    document
        .getElementById(
            "studentName"
        )
        .value = "";


    document
        .getElementById(
            "editCode"
        )
        .value = "";


    selectedSlots = [];

    editingDocumentId = null;

    hasUnsavedChanges = false;


    updateButtonStates();

    updateOtherStudents();


    const badge =
        document.getElementById(
            "editingBadge"
        );


    badge.textContent =
        "";

    badge.classList.add(
        "hidden"
    );


    const notice =
        document.getElementById(
            "unsavedNotice"
        );


    if (notice) {

        notice.classList.add(
            "hidden"
        );

    }


    const saveButton =
        document.getElementById(
            "saveButton"
        );


    saveButton.textContent =
        "🚀 Müsaitliklerimi Gönder";

}


// ========================================
// SAYFADAN ÇIKARKEN UYARI
// ========================================

window.addEventListener(
    "beforeunload",
    function(event) {

        if (
            editingDocumentId &&
            hasUnsavedChanges
        ) {

            event.preventDefault();

            event.returnValue = "";

        }

    }
);


// ========================================
// BUTONLAR
// ========================================

document
    .getElementById(
        "saveButton"
    )
    .addEventListener(
        "click",
        function() {

            updateAvailability();

        }
    );


document
    .getElementById(
        "editFormButton"
    )
    .addEventListener(
        "click",
        function() {

            editAvailability();

        }
    );


// ========================================
// BAŞLANGIÇ
// ========================================

createDays();
