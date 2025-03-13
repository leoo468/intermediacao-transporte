const toggleTheme = document.getElementById("toggle-theme");


document.addEventListener("DOMContentLoaded", () => {
    // Seleção de elementos do DOM
    const loginForm = document.getElementById("login_form");
    const registerForm = document.getElementById("register_form");
    const logoutBtn = document.getElementById("logout_btn");
    const cadastrarFreteBtn = document.getElementById("cadastrar_frete_btn");
    const formFrete = document.getElementById("form_frete");
    const cadFreteForm = document.getElementById("cad_frete_form");
    const tabelaFreteCliente = document.querySelector("#tabela_frete_cliente tbody");
    
    // API de geolocalização (OpenCage)
    const API_KEY = "41cbcd77d85642d0a003c105ba513798";

    async function obterCoordenadas(endereco) {
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(endereco)}&key=${API_KEY}`;
        try {
            const resposta = await fetch(url);
            const dados = await resposta.json();
            if (dados.results.length > 0) {
                return {
                    lat: dados.results[0].geometry.lat,
                    lng: dados.results[0].geometry.lng
                };
            }
            return null;
        } catch (erro) {
            console.error("Erro ao buscar coordenadas:", erro);
            return null;
        }
    }

    // Função para salvar no LocalStorage
    function salvarDados(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    }
    
    // Função para obter dados do LocalStorage
    function obterDados(chave) {
        return JSON.parse(localStorage.getItem(chave)) || [];
    }

    // Autenticação - Login
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            const usuarios = obterDados("usuarios");
            
            const usuario = usuarios.find(u => u.email === email && u.senha === senha);
            if (usuario) {
                localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
                alert("Login realizado com sucesso!");
                window.location.href = "dashboard.html";
            } else {
                alert("Email ou senha incorretos!");
            }
        });
    }

    // Cadastro de usuário
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome").value;
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            const tipo = document.getElementById("tipo").value;
            
            const usuarios = obterDados("usuarios");
            if (usuarios.some(u => u.email === email)) {
                alert("Este email já está cadastrado!");
                return;
            }
            
            usuarios.push({ nome, email, senha, tipo });
            salvarDados("usuarios", usuarios);
            alert("Cadastro realizado com sucesso!");
            window.location.href = "login.html";
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
           if(confirm("Deseja mesmo apagar os dados? Esta ação é irreverssivel! ")){
            localStorage.clear();
            alert("Todos os dados foram apagados com sucesso!");
            window.location.href = "index.html"
           }
        });
    }

    // Dashboard do Cliente
    if (cadastrarFreteBtn) {
        cadastrarFreteBtn.addEventListener("click", () => {
            formFrete.classList.toggle("hidden");
        });
    }

    if (cadFreteForm) {
        cadFreteForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const origem = document.getElementById("origem").value;
            const destino = document.getElementById("destino").value;
            const tipo = document.getElementById("tipo").value;
            const descricao = document.getElementById("descricao").value;

            // Obter coordenadas das localizações
            const coordsOrigem = await obterCoordenadas(origem);
            const coordsDestino = await obterCoordenadas(destino);

            if (!coordsOrigem || !coordsDestino) {
                alert("Não foi possível obter as coordenadas dos endereços.");
                return;
            }

            const fretes = obterDados("fretes");
            const novoFrete = { 
                id: fretes.length + 1, 
                tipo, 
                origem, 
                destino, 
                descricao, 
                status: "Aberto",
                coordenadas: {
                    origem: coordsOrigem,
                    destino: coordsDestino
                }
            };

            fretes.push(novoFrete);
            salvarDados("fretes", fretes);
            atualizarTabelaFretes();
            alert("Frete cadastrado com sucesso!");
            cadFreteForm.reset();
        });
    }

    // Atualizar a tabela de fretes
    function atualizarTabelaFretes() {
        tabelaFreteCliente.innerHTML = "";
        const fretes = obterDados("fretes");
        fretes.forEach(frete => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${frete.id}</td>
                <td>${frete.tipo}</td>
                <td>${frete.origem} (${frete.coordenadas.origem.lat}, ${frete.coordenadas.origem.lng})</td>
                <td>${frete.destino} (${frete.coordenadas.destino.lat}, ${frete.coordenadas.destino.lng})</td>
                <td>R$ ${calcularFrete(frete.coordenadas.origem, frete.coordenadas.destino)}</td>
                <td>${frete.status}</td>
            `;
            tabelaFreteCliente.appendChild(row);
        });
    }

    // Função para calcular distância e estimar preço do frete
    function calcularFrete(origem, destino) {
        const R = 6371; // Raio da Terra em km
        const dLat = grausParaRadianos(destino.lat - origem.lat);
        const dLng = grausParaRadianos(destino.lng - origem.lng);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(grausParaRadianos(origem.lat)) * Math.cos(grausParaRadianos(destino.lat)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distancia = R * c; // Distância em km

        const precoPorKm = 2.5; // Preço estimado por km
        return (distancia * precoPorKm).toFixed(2);
    }

    function grausParaRadianos(graus) {
        return graus * (Math.PI / 180);
    }

    // Atualiza a tabela de fretes ao carregar a página
    if (tabelaFreteCliente) {
        atualizarTabelaFretes();
    }
});

toggleTheme.addEventListener("click" , () =>{
     document.body.classList.toggle("dark-mode");
 
})