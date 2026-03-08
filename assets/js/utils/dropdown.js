export function initCustomSelects() {
    document.querySelectorAll('.custom-select').forEach(setupSelect);

    function setupSelect(select) {
        if (select.dataset.initialized) return;
        
        const trigger = select.querySelector('.select-trigger');
        const options = select.querySelectorAll('.option');

        trigger.addEventListener('click', (e) => {
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== select) s.classList.remove('open');
            });
            select.classList.toggle('open');
            e.stopPropagation();
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                trigger.querySelector('span').innerText = option.innerText;
                select.classList.remove('open');
                select.dataset.value = option.dataset.value;
            });
        });

        select.dataset.initialized = "true";
    }
}

window.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
});