const stateKey = "heleme-home-state";

const defaultState = {
  checkedInAt: "",
  mood: "清醒",
  note: "",
  photoData: "",
  photoTakenAt: "",
  lastReportAt: "",
  contactName: "安心联系人",
  contactPhone: "138 0000 0000"
};

const state = loadState();

const checkInBtn = document.querySelector("#checkInBtn");
const safeBtn = document.querySelector("#safeBtn");
const confirmSafeBtn = document.querySelector("#confirmSafeBtn");
const editContactBtn = document.querySelector("#editContactBtn");
const statusText = document.querySelector("#statusText");
const checkInHint = document.querySelector("#checkInHint");
const lastReport = document.querySelector("#lastReport");
const moodLabel = document.querySelector("#moodLabel");
const noteInput = document.querySelector("#noteInput");
const photoBtn = document.querySelector("#photoBtn");
const photoInput = document.querySelector("#photoInput");
const photoStatus = document.querySelector("#photoStatus");
const photoPreview = document.querySelector("#photoPreview");
const photoImage = document.querySelector("#photoImage");
const photoTime = document.querySelector("#photoTime");
const removePhotoBtn = document.querySelector("#removePhotoBtn");
const safeDialog = document.querySelector("#safeDialog");
const contactDialog = document.querySelector("#contactDialog");
const safeMessage = document.querySelector("#safeMessage");
const contactName = document.querySelector("#contactName");
const contactPhone = document.querySelector("#contactPhone");
const contactNameInput = document.querySelector("#contactNameInput");
const contactPhoneInput = document.querySelector("#contactPhoneInput");
const saveContactBtn = document.querySelector("#saveContactBtn");
const toast = document.querySelector("#toast");
const moodButtons = Array.from(document.querySelectorAll("[data-mood]"));

render();

checkInBtn.addEventListener("click", () => {
  state.checkedInAt = new Date().toISOString();
  state.note = noteInput.value.trim();
  saveState();
  render();
  showToast(state.photoData ? "已完成拍照打卡" : "今日已打卡");
});

safeBtn.addEventListener("click", () => {
  state.note = noteInput.value.trim();
  saveState();
  safeMessage.textContent = buildSafeMessage();
  safeDialog.showModal();
});

confirmSafeBtn.addEventListener("click", () => {
  state.lastReportAt = new Date().toISOString();
  saveState();
  render();
  showToast("已报平安");
});

editContactBtn.addEventListener("click", () => {
  contactNameInput.value = state.contactName;
  contactPhoneInput.value = state.contactPhone;
  contactDialog.showModal();
});

saveContactBtn.addEventListener("click", () => {
  const nextName = contactNameInput.value.trim();
  const nextPhone = contactPhoneInput.value.trim();

  if (nextName) {
    state.contactName = nextName;
  }

  if (nextPhone) {
    state.contactPhone = nextPhone;
  }

  saveState();
  render();
  showToast("联系人已更新");
});

noteInput.addEventListener("input", () => {
  state.note = noteInput.value;
  saveState();
});

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mood = button.dataset.mood;
    saveState();
    render();
  });
});

photoBtn.addEventListener("click", () => {
  photoInput.click();
});

photoInput.addEventListener("change", async () => {
  const [file] = photoInput.files;

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    showToast("请选择图片");
    photoInput.value = "";
    return;
  }

  try {
    state.photoData = await compressImage(file);
    state.photoTakenAt = new Date().toISOString();
    state.checkedInAt = state.photoTakenAt;
    state.note = noteInput.value.trim();
    saveState();
    render();
    showToast("已完成拍照打卡");
  } catch {
    state.photoData = "";
    state.photoTakenAt = "";
    showToast("照片保存失败");
  } finally {
    photoInput.value = "";
  }
});

removePhotoBtn.addEventListener("click", () => {
  state.photoData = "";
  state.photoTakenAt = "";
  saveState();
  render();
  showToast("照片已移除");
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey));
    return { ...defaultState, ...saved };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(stateKey, JSON.stringify(state));
}

function render() {
  const checkedInToday = isToday(state.checkedInAt);
  statusText.textContent = checkedInToday ? `${state.mood} · 已打卡` : "未打卡";
  checkInHint.textContent = checkedInToday ? formatTime(state.checkedInAt) : "记录今晚状态";
  moodLabel.textContent = state.mood;
  noteInput.value = state.note;
  photoStatus.textContent = state.photoData ? "已拍照" : "未拍照";
  photoPreview.hidden = !state.photoData;
  photoBtn.querySelector("strong").textContent = state.photoData ? "重新拍照" : "拍照打卡";

  if (state.photoData) {
    photoImage.src = state.photoData;
    photoTime.textContent = state.photoTakenAt ? formatDateTime(state.photoTakenAt) : "已添加";
  } else {
    photoImage.removeAttribute("src");
    photoTime.textContent = "刚刚添加";
  }

  contactName.textContent = state.contactName;
  contactPhone.textContent = state.contactPhone;
  lastReport.textContent = state.lastReportAt
    ? `上次报平安 ${formatDateTime(state.lastReportAt)}`
    : "还没有报平安记录";

  moodButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === state.mood);
  });
}

function buildSafeMessage() {
  const note = state.note ? `备注：${state.note}` : "备注：暂无额外说明";
  const photo = state.photoData ? "已完成拍照打卡记录" : "暂无拍照记录";
  return `发给 ${state.contactName}：我现在是“${state.mood}”状态，已完成今晚打卡，${photo}。${note}。`;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const image = new Image();

      image.addEventListener("load", () => {
        const maxSize = 1200;
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      });

      image.addEventListener("error", reject);
      image.src = reader.result;
    });

    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function isToday(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}
