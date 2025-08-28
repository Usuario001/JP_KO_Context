document.getElementById("inspect").addEventListener("click", () => {
    chrome.devtools.inspectedWindow.eval(`
    (function() {
        function safeStringify(obj, space = 2) {
          const seen = new WeakSet();
          return JSON.stringify(obj, function(key, value) {
            if (typeof value === "object" && value !== null) {
              // evitar ventanas, iframes u objetos DOM
              if (value instanceof Window) return "[Window]";
              if (value instanceof HTMLElement) return "[HTMLElement]";
              if (seen.has(value)) return "[Circular]";
              seen.add(value);
            }
            return value;
          }, space);
        }
        try {
            var $0 = window.$0;
            if (!$0) return "No hay elemento seleccionado";
    
            var ko = requirejs("ko");
            var context = ko.dataFor($0) || ko.contextFor($0);
            
            if (!context) return "No se encontró contexto Knockout";
            return safeStringify(context);
        } catch(e) {
            return "Error: " + e.message;
        }
    })()
  `,(result, isException) => {
        try {
            const parsed = JSON.parse(result);
            let html = `
              <h3>Knockout Context</h3>
              <p><strong>Nombre:</strong> ${parsed.name || "(sin nombre)"}</p>
              <p><strong>Provider:</strong> ${parsed.provider || "(sin provider)"}</p>
            `;
            const keys = Object.keys(parsed).filter(k => parsed[k] != null);

            if (keys.length) {
                html += "<h4>Propiedades del Context:</h4><ol>";
                keys.forEach(k => {
                    let value = parsed[k];

                    if (typeof value === "object") {
                        // mostrar las claves internas si hay
                        const innerKeys = Object.keys(value);
                        if (innerKeys.length) {
                            html += `<li><strong>${k}:</strong><ul>`;
                            innerKeys.forEach(ik => {
                                html += `<li>${ik}: ${JSON.stringify(value[ik])}</li>`;
                            });
                            html += "</ul></li>";
                        } else {
                            html += `<li><strong>${k}:</strong> {}</li>`;
                        }
                    } else {
                        html += `<li><strong>${k}:</strong> ${value}</li>`;
                    }
                });
                html += "</ol>";
            }
            //console.json(parsed);

            var script = document.createElement('script'),
                code   = document.createTextNode('(' + parsed + ')();');
            script.appendChild(code);
            //(document.body || document.head || document.documentElement).appendChild(script);

            document.getElementById("output").innerHTML = html;

            document.getElementById("filter").addEventListener("change", (event, elem) => {
                var filter = event.target.value;
                if(filter in parsed){
                    var formatted = JSON.stringify(parsed[filter], undefined, 2);
                    document.getElementById("outputFilter").innerHTML = `<pre>${formatted}</pre>`
                }
            });

            //document.getElementById("output").appendChild(script);
        } catch (e) {
            document.getElementById("output").textContent = result;
        }
    })
});
