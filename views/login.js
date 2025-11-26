document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector(".sign-in form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = form.querySelector('input[type="email"]').value;
        const senha = form.querySelector('input[type="password"]').value;

        const resp = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const data = await resp.json();

        if (data.ok) {
            window.location.href = "/home";
        } else {
            alert("❌ Email ou senha incorretos!");
        }

    });
});
