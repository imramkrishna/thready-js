import thready from "./thready-js/thready.config.js";
async function main(){
    const result=await thready.execute('factorial',5);
    console.log(`Factorial Result: ${result}`);
}
main()