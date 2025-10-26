// Script de débogage pour vérifier le contenu de Firestore
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firebase';

async function debugFirestore() {
  console.clear();
  console.log('🔍 === DEBUG FIRESTORE - RECHERCHE CONNEXIONS ODOO ===');
  console.log('');

  const userId = "test_user";
  const companyId = "demo_company";

  const results: any = {
    users: null,
    companies: null,
    integrations: null,
    saas_connections: null,
    collections: {}
  };

  // Vérifier users/test_user
  console.log('📁 Checking users/test_user...');
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      console.log('✅ Document exists');
      const data = userDoc.data();
      results.users = data;
      console.log('Data:', data);
      console.log('');

      // Vérifier spécifiquement les connexions Odoo
      if (data.connections) console.log('🔍 Found "connections" field:', data.connections);
      if (data.integrations) console.log('🔍 Found "integrations" field:', data.integrations);
      if (data.odoo) console.log('🔍 Found "odoo" field:', data.odoo);
      if (data.saas_connections) console.log('🔍 Found "saas_connections" field:', data.saas_connections);
    } else {
      console.log('❌ Document does not exist');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  console.log('');

  // Vérifier companies/demo_company
  console.log('📁 Checking companies/demo_company...');
  try {
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    if (companyDoc.exists()) {
      console.log('✅ Document exists');
      const data = companyDoc.data();
      results.companies = data;
      console.log('Data:', data);
      console.log('');

      if (data.connections) console.log('🔍 Found "connections" field:', data.connections);
      if (data.integrations) console.log('🔍 Found "integrations" field:', data.integrations);
      if (data.odoo) console.log('🔍 Found "odoo" field:', data.odoo);
    } else {
      console.log('❌ Document does not exist');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  console.log('');

  // Vérifier integrations/demo_company
  console.log('📁 Checking integrations/demo_company...');
  try {
    const intDoc = await getDoc(doc(db, 'integrations', companyId));
    if (intDoc.exists()) {
      console.log('✅ Document exists');
      const data = intDoc.data();
      results.integrations = data;
      console.log('Data:', data);
      console.log('');

      if (data.connections) console.log('🔍 Found "connections" field:', data.connections);
      if (data.odoo) console.log('🔍 Found "odoo" field:', data.odoo);
    } else {
      console.log('❌ Document does not exist');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  console.log('');

  // Vérifier saas_connections/demo_company
  console.log('📁 Checking saas_connections/demo_company...');
  try {
    const saasDoc = await getDoc(doc(db, 'saas_connections', companyId));
    if (saasDoc.exists()) {
      console.log('✅ Document exists');
      const data = saasDoc.data();
      results.saas_connections = data;
      console.log('Data:', data);
      console.log('');
    } else {
      console.log('❌ Document does not exist');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  console.log('');

  // Lister toutes les collections disponibles
  console.log('📚 Listing sample documents from common collections...');
  const commonCollections = ['users', 'companies', 'integrations', 'settings', 'connections', 'saas_connections'];

  for (const collName of commonCollections) {
    try {
      console.log('');
      console.log(`📂 Collection: ${collName}`);
      const q = query(collection(db, collName), limit(5));
      const snapshot = await getDocs(q);
      console.log(`   Documents found: ${snapshot.size}`);

      const docs: any[] = [];
      snapshot.forEach(docSnap => {
        console.log(`   📄 Document ID: ${docSnap.id}`);
        const data = docSnap.data();
        docs.push({ id: docSnap.id, data });

        // Afficher les clés principales
        console.log(`      Keys: ${Object.keys(data).join(', ')}`);

        // Si c'est le document qui nous intéresse, afficher tout
        if (docSnap.id === userId || docSnap.id === companyId) {
          console.log(`      ⭐ Full Data:`, data);
        }
      });

      results.collections[collName] = docs;
    } catch (error: any) {
      console.log(`   ⚠️ Collection "${collName}" might not exist or permission denied:`, error.message);
    }
  }

  console.log('');
  console.log('🔍 === FIN DEBUG ===');
  console.log('');
  console.log('💡 RÉSUMÉ:');
  console.log('- users/test_user:', results.users ? '✅ Existe' : '❌ N\'existe pas');
  console.log('- companies/demo_company:', results.companies ? '✅ Existe' : '❌ N\'existe pas');
  console.log('- integrations/demo_company:', results.integrations ? '✅ Existe' : '❌ N\'existe pas');
  console.log('- saas_connections/demo_company:', results.saas_connections ? '✅ Existe' : '❌ N\'existe pas');
  console.log('');
  console.log('📦 Objet complet des résultats disponible ci-dessous:');

  return results;
}

// Exporter pour utilisation dans la console
(window as any).debugFirestore = debugFirestore;

console.log('🔧 Debug script loaded! Run "await debugFirestore()" in console to start debugging.');

export { debugFirestore };
