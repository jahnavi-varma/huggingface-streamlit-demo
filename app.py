import streamlit as st
from transformers import pipeline

# Load Hugging Face model
model = pipeline("sentiment-analysis")

# Streamlit UI
st.title("Hugging Face + Streamlit Demo")
st.write("Enter some text and let the model predict sentiment!")

user_input = st.text_area("Your Text Here:")

if st.button("Analyze"):
    if user_input.strip() != "":
        with st.spinner("Analyzing..."):
            result = model(user_input)
            st.success("Analysis complete!")
            st.write("### Result:")
            st.json(result)
    else:
        st.warning("Please enter some text.")
